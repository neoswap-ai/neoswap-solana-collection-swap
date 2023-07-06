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
import { ErrorFeedback, ItemStatus, SwapData, SwapIdentity, TxWithSigner } from "../utils/types";
import { Program } from "@project-serum/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";

export async function createInitializeSwapInstructions(Data: {
    swapData: SwapData;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
}): Promise<{
    swapIdentity: SwapIdentity;
    programId: string;
    transactions: TxWithSigner[];
}> {
    if (!Data.swapData.preSeed) Data.swapData.preSeed = "0000";
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl });

    const swapIdentity = getSwapIdentityFromData({
        swapData: Data.swapData,
    });

    try {
        const initInstruction = await getInitInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
            acceptedPayement: Data.swapData.acceptedPayement,
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

        let transactions: TxWithSigner[] = [];

        if (initInstruction) {
            transactions.push({
                tx: new Transaction().add(initInstruction),
                // signers: [signer],
            });
        } else {
            console.log("Init-Initialize swap skipped");
        }

        if (addInstructions) {
            addInstructions.map((addInstruction) => {
                transactions.push({
                    tx: new Transaction().add(...addInstruction),
                    // signers: [signer],
                });
            });
        } else {
            console.log("skip addInstrutions");
        }

        transactions.push({
            tx: new Transaction().add(validateInstruction),
        });

        return {
            swapIdentity,
            programId: program.programId.toBase58(),
            transactions,
        };
    } catch (error) {
        console.log("error init", error);

        throw [
            {
                blockchain: "solana",
                status: "error",
                message: error,
                ...swapIdentity,
            },
        ];
    }
}

async function getInitInitilizeInstruction(Data: {
    program: Program;
    acceptedPayement: PublicKey;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}): Promise<TransactionInstruction | undefined> {
    let initSwapData: SwapData = {
        initializer: Data.swapIdentity.swapData.initializer,
        items: [],
        nbItems: Data.swapIdentity.swapData.nbItems,
        preSeed: Data.swapIdentity.swapData.preSeed,
        status: Data.swapIdentity.swapData.status,
        acceptedPayement: Data.acceptedPayement,
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
        console.log("swap Account already initialized");
        return undefined;
    }
}

async function getAddInitilizeInstructions(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}): Promise<TransactionInstruction[][] | undefined> {
    let bcData: SwapData | undefined = undefined;
    try {
        bcData = await getSwapDataAccountFromPublicKey({
            program: Data.program,
            swapDataAccount_publicKey: Data.swapIdentity.swapDataAccount_publicKey,
        });
        // console.log("bcData", bcData);
    } catch (error) {
        //@ts-ignore
        // console.log("swapAccount doenst exist", error.message);
    }

    let transactionInstructionBundle = [];
    let chunkSize = 6;
    let returnData: (ErrorFeedback | undefined)[] = [];
    for (let index = 0; index < Data.swapIdentity.swapData.items.length; index += chunkSize) {
        const chunkIx: TransactionInstruction[] = [];
        returnData = await Promise.all(
            Data.swapIdentity.swapData.items.slice(index, index + chunkSize).map(async (item) => {
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

                    const tokenAccount = await findOrCreateAta({
                        mint: item.mint,
                        owner: item.owner,
                        program: Data.program,
                        signer: Data.signer,
                    });
                    if (item.amount.isNeg() && !item.mint.equals(SystemProgram.programId)) {
                        // console.log("check balance");

                        const balance =
                            await Data.program.provider.connection.getTokenAccountBalance(
                                tokenAccount.mintAta
                            );

                        if (!balance.value.uiAmount) {
                            return {
                                blockchain: "solana",
                                order: 0,
                                status: "error",
                                message: `cannot retrieve the balance of ${tokenAccount.mintAta.toBase58()}`,
                            } as ErrorFeedback;
                        } else if (balance.value.uiAmount < item.amount.toNumber()) {
                            return {
                                blockchain: "solana",
                                order: 0,
                                status: "error",
                                message: `found ${
                                    balance.value.uiAmount
                                } / ${item.amount.toNumber()}  in the associated token account ${tokenAccount.mintAta.toBase58()} linked to mint ${item.mint.toBase58()}`,
                            } as ErrorFeedback;
                        }
                    }

                    console.log(
                        "XXX - added item ",
                        item.mint.toBase58(),
                        " from ",
                        item.owner.toBase58(),
                        " amount ",
                        item.amount.toNumber(),
                        " - XXX",
                        item
                    );
                    chunkIx.push(
                        await Data.program.methods
                            .initializeAdd(Data.swapIdentity.swapDataAccount_seed, item)
                            .accounts({
                                swapDataAccount:
                                    Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                                signer: Data.signer.toBase58(),
                            })
                            .instruction()
                    );
                }
            })
        );
        if (chunkIx.length > 0) transactionInstructionBundle.push(chunkIx);
    }
    // console.log("returnData", returnData);

    if (returnData.length > 0) {
        let errorFeedback: ErrorFeedback = {
            blockchain: "solana",
            status: "error",
            message: "",
        };

        for (let index = 0; index < returnData.length; index++) {
            const element = returnData[index];
            if (element) {
                errorFeedback.message = String(errorFeedback.message).concat(
                    `  /\/\  ` + String(element.message)
                );
            }
        }

        if (errorFeedback.message !== "") {
            throw errorFeedback;
        }
    }
    let nbItems = 0;
    transactionInstructionBundle.forEach((transactionInstructionArray) => {
        nbItems += transactionInstructionArray.length;
    });
    console.log("there is ", nbItems, " items to initialize");
    if (nbItems > 0) {
        return transactionInstructionBundle;
    } else {
        return undefined;
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
