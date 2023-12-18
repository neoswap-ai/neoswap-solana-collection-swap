import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import {
    Cluster,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    InitializeData,
    NftSwapItem,
    SwapData,
    SwapIdentity,
    SwapInfo,
    TokenSwapItem,
    TxWithSigner,
} from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { swapDataConverter } from "../utils/swapDataConverter.function";
import { getCNFTOwner } from "../utils/getCNFTData.function";

export async function createModifySwapInstructions(Data: {
    swapInfo: SwapInfo;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
    program?: Program;
    validateOwnership?: "warning" | "error";
    validateOwnershipIgnore?: string[];
}): Promise<InitializeData> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });

    let swapIdentity = await swapDataConverter({
        swapInfo: Data.swapInfo,
        clusterOrUrl: Data.clusterOrUrl,
        connection: program.provider.connection,
    });
    swapIdentity.swapData.initializer = Data.signer;
    console.log("swapData to initialize", swapIdentity);
    console.log("swapData ", swapIdentity.swapData.nftItems, swapIdentity.swapData.tokenItems);

    try {
        const initInstruction = await getInitInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
            // acceptedPayement: swapIdentity.swapData.acceptedPayement,
        });

        const addInstructions = await getAddInitilizeInstructions({
            program,
            swapIdentity,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            validateOwnership: Data.validateOwnership,
            validateOwnershipIgnore: Data.validateOwnershipIgnore,
        });

        const validateInstruction = await getValidateInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
        });

        let txWithoutSigner: TxWithSigner[] = [];

        if (initInstruction) {
            txWithoutSigner.push({
                tx: new Transaction().add(initInstruction),
                // signers: [signer],
            });
        } else {
            console.log("Init-Initialize swap skipped");
        }

        if (addInstructions.ix) {
            addInstructions.ix.map((addInstruction) => {
                txWithoutSigner.push({
                    tx: new Transaction().add(...addInstruction),
                    // signers: [signer],
                });
            });
        } else {
            console.log("Add-Instrutions was skipped");
        }

        if (!!validateInstruction)
            txWithoutSigner.push({
                tx: new Transaction().add(validateInstruction),
            });

        return {
            // initializeData: {
            swapIdentity,
            programId: program.programId,
            txWithoutSigner,
            warning: addInstructions.warning,
            // },
            // shouldError: addInstructions.shouldError,
        };
    } catch (error: any) {
        console.log("error init", error);

        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            ...swapIdentity,
        };
    }
}

async function getInitInitilizeInstruction(Data: {
    program: Program;
    // acceptedPayement: PublicKey;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}): Promise<TransactionInstruction | undefined> {
    let initSwapData: SwapData = {
        initializer: Data.swapIdentity.swapData.initializer,
        nftItems: [],
        tokenItems: [],
        nbItems: Data.swapIdentity.swapData.nbItems,
        preSeed: Data.swapIdentity.swapData.preSeed,
        status: Data.swapIdentity.swapData.status,
        acceptedPayement: Data.swapIdentity.swapData.acceptedPayement,
    };
    const balanceSda = await Data.program.provider.connection.getBalance(
        Data.swapIdentity.swapDataAccount_publicKey
    );
    // console.log("balance SDA", balanceSda);

    if (balanceSda === 0) {
        return Data.program.methods
            .initInitialize(Data.swapIdentity.swapDataAccount_seed, initSwapData)
            .accounts({
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                signer: Data.signer.toBase58(),
                systemProgram: SystemProgram.programId.toBase58(),
            })
            .instruction();
    } else {
        // console.log("swap Account already initialized");
        return undefined;
    }
}

async function getAddInitilizeInstructions(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
    validateOwnership?: "warning" | "error";
    validateOwnershipIgnore?: string[];
}): Promise<{
    ix: TransactionInstruction[][] | undefined;
    warning: string;
    // shouldError: boolean;
}> {
    let bcData: SwapData | undefined = undefined;
    try {
        bcData = await getSwapDataAccountFromPublicKey({
            program: Data.program,
            swapDataAccount_publicKey: Data.swapIdentity.swapDataAccount_publicKey,
        });
        // console.log("bcData", bcData);
    } catch (error) {
        // console.log("swapAccount doenst exist", error.message);
    }

    let transactionInstructionBundle = [];
    let chunkSize = 4;
    let returnData: { e: string; mint: PublicKey }[] = [];
    let allItems: (NftSwapItem | TokenSwapItem)[] = [
        ...Data.swapIdentity.swapData.nftItems,
        ...Data.swapIdentity.swapData.tokenItems,
    ];
    for (let index = 0; index < allItems.length; index += chunkSize) {
        const chunkIx: TransactionInstruction[] = [];

        for await (const item of allItems.slice(index, index + chunkSize)) {
            let alreadyExistNftItems: NftSwapItem[] | undefined = [];
            let alreadyExistTokensItems: TokenSwapItem[] | undefined = [];
            if ("mint" in item) {
                alreadyExistNftItems = bcData?.nftItems.filter(
                    (itemSDA) =>
                        itemSDA.owner.equals(item.owner) &&
                        itemSDA.mint.equals(item.mint) &&
                        itemSDA.destinary.equals(item.destinary)
                );
            } else {
                alreadyExistTokensItems = bcData?.tokenItems.filter(
                    (itemSDA) => itemSDA.owner.equals(item.owner) && itemSDA.amount == item.amount
                );
            }

            if (
                (alreadyExistNftItems?.length === 0 || !alreadyExistNftItems) &&
                (alreadyExistTokensItems?.length === 0 || !alreadyExistTokensItems)
            ) {
                // console.log("alreadyExistItems", alreadyExistItems);
                // console.log("item", item);
                // console.log("checkbal", item.mint.toBase58());

                if ("mint" in item && !!!item.isCompressed) {
                    const tokenAccount = await findOrCreateAta({
                        mint: item.mint,
                        owner: item.owner,
                        clusterOrUrl: Data.clusterOrUrl,
                        signer: Data.signer,
                    });

                    if (
                        !!Data.validateOwnership &&
                        !item.owner.equals(Data.swapIdentity.swapData.acceptedPayement)
                    ) {
                        console.log(
                            "check NFT/Token balance",
                            "\nmint:",
                            item.mint.toBase58(),
                            "\nowner:",
                            item.owner.toBase58(),
                            // "program:",
                            // Data.program,
                            // "\nsigner:",
                            // Data.signer.toBase58(),
                            "\nATA:",
                            tokenAccount.mintAta.toBase58()
                        );

                        try {
                            const balance =
                                await Data.program.provider.connection.getTokenAccountBalance(
                                    tokenAccount.mintAta
                                );
                            console.log(
                                "balance ",
                                balance.value.uiAmount,
                                " / ",
                                item.amount.toNumber()
                            );
                            // await delay(1000);

                            if (!balance.value.uiAmount && balance.value.uiAmount !== 0) {
                                returnData.push({
                                    e: `User: ${item.owner.toBase58()} \nMint: ${item.mint.toBase58()}\nATA: ${tokenAccount.mintAta.toBase58()} \nError: cannot retrieve the balance\n\n`,
                                    mint: item.mint,
                                });
                            } else if (balance.value.uiAmount < item.amount.toNumber()) {
                                returnData.push({
                                    e: `User: ${item.owner.toBase58()} \nMint: ${item.mint.toBase58()}\nATA: ${tokenAccount.mintAta.toBase58()} \nError: not enough funds; found ${
                                        balance.value.uiAmount
                                    } / ${item.amount.toNumber()} NFT the user own\n\n`,
                                    mint: item.mint,
                                });
                            }
                        } catch (error) {
                            console.log("error in get ataBalance :\n", error);

                            returnData.push({
                                e: `User: ${item.owner.toBase58()} \nMint: ${item.mint.toBase58()}\nATA: ${tokenAccount.mintAta.toBase58()} \nError: Couldn't find the NFT owned by user \n\n`,
                                mint: item.mint,
                            });
                        }
                    }
                    console.log(
                        "XXX - added NFT item with Mint ",
                        item.mint.toBase58(),
                        " from ",
                        item.owner.toBase58(),
                        " amount ",
                        item.amount.toNumber(),
                        " - XXX"
                    );
                } else if ("mint" in item && !!item.isCompressed) {
                    if (
                        !!Data.validateOwnership &&
                        !item.owner.equals(Data.swapIdentity.swapData.acceptedPayement)
                    ) {
                        const owner = await getCNFTOwner({
                            tokenId: item.mint.toBase58(),
                            Cluster: Data.clusterOrUrl.includes("mainnet")
                                ? "mainnet-beta"
                                : "devnet",
                        });
                        console.log(
                            "XXX - added CNFT item with TokenId ",
                            item.mint.toBase58(),
                            " from ",
                            item.owner.toBase58(),
                            " amount ",
                            item.amount.toNumber(),
                            " - XXX"
                        );
                        if (!item.owner.equals(owner)) {
                            returnData.push({
                                e: `User: ${item.owner.toBase58()} \nTokenId: ${item.mint.toBase58()} \nError: Couldn't find the cNFT owned by user, owner is ${owner}`,
                                mint: item.mint,
                            });
                        }
                    }
                } else {
                    console.log(
                        "XXX - added payment Item from ",
                        item.owner.toBase58(),
                        " amount ",
                        item.amount.toNumber(),
                        " - XXX"
                    );
                }

                chunkIx.push(
                    await Data.program.methods
                        .initializeAdd(Data.swapIdentity.swapDataAccount_seed, item)
                        .accounts({
                            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                            signer: Data.signer.toBase58(),
                        })
                        .instruction()
                );
            }
        }

        if (chunkIx.length > 0) transactionInstructionBundle.push(chunkIx);
    }
    // console.log("returnData", returnData);
    // let pKstring: string[] = [];
    // let warningIsError = false;
    // if (Data.warningIsError?.length === 0) {
    //     warningIsError = true;
    // }
    // console.log("warningIsError", Data.warningIsError);
    // console.log("pKstring", pKstring);

    let warning = "";
    if (!!Data.validateOwnership)
        if (returnData.length > 0) {
            for (let index = 0; index < returnData.length; index++) {
                if (
                    Data.validateOwnership === "error" &&
                    (!Data.validateOwnershipIgnore || //!!Data.validateOwnershipIgnore &&
                        !Data.validateOwnershipIgnore.includes(returnData[index].mint.toString()))
                )
                    throw returnData[index].e;
                warning = String(warning).concat(`\n\n  /\/\  ` + String(returnData[index].e));
                // }
            }
        }
    // if (Data.warningIsError) warningIsError = false;

    let nbItems = 0;
    transactionInstructionBundle.forEach((transactionInstructionArray) => {
        nbItems += transactionInstructionArray.length;
    });
    console.log("there is ", nbItems, " items to initialize");
    if (nbItems > 0) {
        return {
            ix: transactionInstructionBundle,
            warning,
            // shouldError: Data.warningIsError?.length === 0,
        };
    } else {
        return {
            ix: undefined,
            warning,
            // shouldError: false
        };
    }
}

async function getValidateInitilizeInstruction(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}) {
    let status = 0;
    try {
        const swapData = await getSwapDataAccountFromPublicKey({
            program: Data.program,
            swapDataAccount_publicKey: Data.swapIdentity.swapDataAccount_publicKey,
        });

        swapData?.status ? (status = swapData.status) : 0;
    } catch (_) {}

    if (status === 0)
        return Data.program.methods
            .validateInitialize(Data.swapIdentity.swapDataAccount_seed)
            .accounts({
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                signer: Data.signer.toBase58(),
            })
            .instruction();
}
