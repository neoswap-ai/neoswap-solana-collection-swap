import { getProgram } from "../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import {
    Cluster,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    ErrorFeedback,
    InitializeData,
    ItemStatus,
    SwapData,
    SwapIdentity,
    SwapInfo,
    TxWithSigner,
} from "../utils/types";
import { Program } from "@project-serum/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { delay } from "../utils/delay";
import { swapDataConverter } from "../utils/swapDataConverter.function";

export async function createInitializeSwapInstructions(Data: {
    swapInfo: SwapInfo;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
}): Promise<InitializeData> {
    let swapIdentity = await swapDataConverter({
        swapInfo: Data.swapInfo,
        isDevnet: Data.clusterOrUrl.toLocaleLowerCase().includes("devnet"),
    });
    swapIdentity.swapData.initializer = Data.signer;
    console.log("swapData to initialize", swapIdentity);
    console.log("swapData ", swapIdentity.swapData.items);

    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl });

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

        txWithoutSigner.push({
            tx: new Transaction().add(validateInstruction),
        });

        return {
            swapIdentity,
            programId: program.programId,
            txWithoutSigner,
            warning: addInstructions.warning,
        };
    } catch (error) {
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
}): Promise<{
    ix: TransactionInstruction[][] | undefined;
    warning: string;
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
    let chunkSize = 6;
    let returnData: ErrorFeedback[] = [];
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

                if (
                    Math.sign(item.amount.toNumber()) === 1 &&
                    !item.mint.equals(SystemProgram.programId)
                ) {
                    const tokenAccount = await findOrCreateAta({
                        mint: item.mint,
                        owner: item.owner,
                        program: Data.program,
                        signer: Data.signer,
                    });
                    console.log("check balance");

                    const balance = await Data.program.provider.connection.getTokenAccountBalance(
                        tokenAccount.mintAta
                    );
                    console.log("balance ", balance.value.uiAmount, " / ", item.amount.toNumber());
                    await delay(1000);

                    if (!balance.value.uiAmount && balance.value.uiAmount !== 0) {
                        returnData.push({
                            blockchain: "solana",
                            order: 0,
                            status: "error",
                            message: `\ncannot retrieve the balance of ${tokenAccount.mintAta.toBase58()} from user ${item.owner.toBase58()} with mint ${item.mint.toBase58()}}`,
                        } as ErrorFeedback);
                    } else if (balance.value.uiAmount < item.amount.toNumber()) {
                        returnData.push({
                            blockchain: "solana",
                            order: 0,
                            status: "error",
                            message: `\nfound ${
                                balance.value.uiAmount
                            } / ${item.amount.toNumber()}  in the associated token account ${tokenAccount.mintAta.toBase58()} linked to mint ${item.mint.toBase58()} from user ${item.owner.toBase58()} `,
                        } as ErrorFeedback);
                    }
                }

                console.log(
                    "XXX - added item ",
                    item.mint.toBase58(),
                    " from ",
                    item.owner.toBase58(),
                    " amount ",
                    item.amount.toNumber(),
                    " - XXX"
                );
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

    let warning = "";
    if (returnData.length > 0) {
        for (let index = 0; index < returnData.length; index++) {
            const element = returnData[index];
            if (element) {
                warning = String(warning).concat(`  /\/\  ` + String(element.message));
            }
        }

        // if (errorFeedback.message !== "") {
        //     throw errorFeedback;
        // }
    }
    let nbItems = 0;
    transactionInstructionBundle.forEach((transactionInstructionArray) => {
        nbItems += transactionInstructionArray.length;
    });
    console.log("there is ", nbItems, " items to initialize");
    if (nbItems > 0) {
        return { ix: transactionInstructionBundle, warning };
    } else {
        return { ix: undefined, warning };
    }
}

async function getValidateInitilizeInstruction(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}) {
    return Data.program.methods
        .validateInitialize(Data.swapIdentity.swapDataAccount_seed)
        .accounts({
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
            signer: Data.signer.toBase58(),
        })
        .instruction();
}
