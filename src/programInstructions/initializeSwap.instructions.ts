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
    SwapData,
    SwapIdentity,
    SwapInfo,
    TxWithSigner,
} from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { swapDataConverter } from "../utils/swapDataConverter.function";
import { getCNFTOwner } from "../utils/getCNFTData.function";

export async function createInitializeSwapInstructions(Data: {
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
    console.log("swapData ", swapIdentity.swapData.items);

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

        let users: PublicKey[] = [];
        swapIdentity.swapData.items.forEach((item) => {
            if (!String(users).includes(item.owner.toString()) && item.isPresigning === true) {
                // console.log('item.owner', item.owner.toBase58());

                users.push(item.owner);
            }
        });

        let usersValidateItemsInstructions = await validateUserPdaItems({
            program,
            swapIdentity,
            signer: Data.signer,
            users,
        });

        const validatePresigningSwapInstruction = await validatePresigningSwap({
            program: program,
            signer: Data.signer,
            swapIdentity,
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

        if (!!usersValidateItemsInstructions && usersValidateItemsInstructions.length > 0)
            txWithoutSigner.push({
                tx: new Transaction().add(...usersValidateItemsInstructions),
            });

        if (validatePresigningSwapInstruction)
            txWithoutSigner.push({
                tx: new Transaction().add(validatePresigningSwapInstruction),
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
        items: [],
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
    for (let index = 0; index < Data.swapIdentity.swapData.items.length; index += chunkSize) {
        const chunkIx: TransactionInstruction[] = [];

        for await (const item of Data.swapIdentity.swapData.items.slice(index, index + chunkSize)) {
            const alreadyExistItems = bcData?.items.filter(
                (itemSDA) =>
                    itemSDA.mint.equals(item.mint) &&
                    itemSDA.owner.equals(item.owner) &&
                    itemSDA.destinary.equals(item.destinary)
            );
            // console.log("alreadyExistItems", alreadyExistItems?.length);
            // if (!alreadyExistItems) {
            //     console.log("should't go there");
            // } else
            if (alreadyExistItems?.length === 0 || !alreadyExistItems) {
                // console.log("alreadyExistItems", alreadyExistItems);
                // console.log("item", item);
                // console.log("checkbal", item.mint.toBase58());

                if (
                    !!!item.amount.isNeg() &&
                    // !!!item.mint.equals(SystemProgram.programId) &&
                    !!!item.isCompressed &&
                    !!item.isNft
                ) {
                    const tokenAccount = await findOrCreateAta({
                        mint: item.mint,
                        owner: item.owner,
                        // connection: Data.program.provider.connection,
                        clusterOrUrl: Data.clusterOrUrl,
                        signer: Data.signer,
                    });

                    if (!!Data.validateOwnership) {
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
                } else if (!!item.isCompressed) {
                    if (!!Data.validateOwnership) {
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
                        !!item.mint.equals(SystemProgram.programId) ? "" : item.mint.toBase58(),
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

        // returnData = await Promise.all(
        //     Data.swapIdentity.swapData.items.slice(index, index + chunkSize).map(async (item) => {})
        // );
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

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const validateUserPdaItems = async (Data: {
    signer: PublicKey;
    program: Program;
    users: PublicKey[];
    swapIdentity: SwapIdentity;
}): Promise<TransactionInstruction[]> => {
    let usersValidateItemsTransactions: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }[] = [];
    let instructions: TransactionInstruction[] = [];
    // const { swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
    //     swapDataAccount: Data.swapDataAccount,
    //     CONST_PROGRAM: Data.CONST_PROGRAM,
    //     provider: Data.program.provider as AnchorProvider,
    // });
    // const { swapDataAccount_bump, swapDataAccount_seed, swapDataAccount } = await getSeedFromData({
    //     swapDataGiven: Data.swapData,
    //     CONST_PROGRAM: Data.CONST_PROGRAM,
    // });
    await Promise.all(
        Data.users.map(async (user) => {
            // if (item.isNft) {
            const [userPda, userBump] = PublicKey.findProgramAddressSync(
                [user.toBytes()],
                Data.program.programId
            );
            console.log("\n\nowner", user.toBase58(), "\nuserPda", userPda.toBase58());

            // const userPdaData = await Data.program.account.userPdaData.fetch(userPda);
            // console.log('userPdaData', userPdaData);

            // let delegatedItem = await getAssociatedTokenAddress(item.mint, item.owner);
            // console.log('delegatedItem', delegatedItem.toBase58());

            const validateUserPdaItemsIx = await Data.program.methods
                .validateUserPdaItems(Data.swapIdentity.swapDataAccount_seed)
                .accounts({
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    userPda,
                    user,
                    signer: Data.signer,
                    // splTokenProgram: splAssociatedTokenAccountProgramId,
                    // systemProgram: web3.SystemProgram.programId,
                })
                .instruction();

            instructions.push(validateUserPdaItemsIx);
        })
    );

    // usersValidateItemsTransactions = await convertAllTransaction(
    //     appendTransactionToArray({ mainArray: [new Transaction()], itemToAdd: instructions })
    // );
    return instructions;
};

export const validatePresigningSwap = async (Data: {
    signer: PublicKey;
    program: Program;
    swapIdentity: SwapIdentity;
}): Promise<TransactionInstruction> => {
    return await Data.program.methods
        .validatePresigningSwap(Data.swapIdentity.swapDataAccount_seed)
        .accounts({
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
            signer: Data.signer,
        })
        .instruction();
};
