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
import { isError, isErrorAddInit } from "../utils/isError.function";
("@project-serum/anchor");
// import { SOLANA_SPL_ATA_PROGRAM_ID } from "../utils/const";

export async function createInitializeSwapInstructions(Data: {
    swapData: SwapData;
    signer: PublicKey;
    // preSeed: string;
    cluster: Cluster | string;
}): Promise<
    | {
          swapIdentity: SwapIdentity;
          programId: string;
          transactions: TxWithSigner;
      }
    | { programId: string; swapIdentity?: SwapIdentity; error: ErrorFeedback }
> {
    if (!Data.swapData.preSeed) Data.swapData.preSeed = "0000";
    const program = getProgram(Data.cluster);

    const swapIdentity = getSwapIdentityFromData({
        swapData: Data.swapData,
        // preSeed: Data.preSeed,
    });
    if (!swapIdentity)
        return {
            programId: program.programId.toString(),
            // swapIdentity: swapIdentity,
            error: [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "Couldn't create the swapIdentity",
                },
            ] as ErrorFeedback,
        };
    // const bcData = await getSwapDataAccountFromPublicKey({
    //     program: program,
    //     swapDataAccount_publicKey: swapIdentity.swapDataAccount_publicKey,
    // });
    // console.log("swapIdentity", swapIdentity);

    try {
        // console.log("swapIdentity before init", swapIdentity);
        const initInstruction = await getInitInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
            acceptedPayement: Data.swapData.acceptedPayement,
        });
        // console.log("swapIdentity before add", initInstruction);

        const addInstructions = await getAddInitilizeInstructions({
            program,
            swapIdentity,
            signer: Data.signer,
        });
        // console.log("addInstructions", addInstructions);
        // console.log("swapIdentity before validate", swapIdentity);
        const validateInstruction = await getValidateInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
        });

        let transactions: TxWithSigner = [];

        if (initInstruction) {
            transactions.push({
                tx: new Transaction().add(initInstruction),
                // signers: [signer],
            });
        } else {
            console.log("Initialize swap skipped");
        }

        if (addInstructions) {
            if (isErrorAddInit(addInstructions)) {
                console.log("isErrorAddInit");

                return {
                    programId: program.programId.toString(),
                    swapIdentity: swapIdentity,
                    error: addInstructions,
                };
            }
            addInstructions.map((addInstruction) => {
                transactions.push({
                    tx: new Transaction().add(...addInstruction),
                    // signers: [signer],
                });
            });
        } else {
            console.log("Adding Items to swap skipped");
        }

        transactions.push({
            tx: new Transaction().add(validateInstruction),
            // signers: [signer],
        });

        // if (validateInstruction) {
        // } else {
        //     throw "nothing to initialize";
        // }

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
                type: "error",
                order: 0,
                description: error,
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
    // Data.swapIdentity.swapData.nbItems = Data.swapIdentity.swapData.items.length;
    let initSwapData: SwapData = {
        initializer: Data.swapIdentity.swapData.initializer,
        items: [],
        nbItems: Data.swapIdentity.swapData.nbItems,
        preSeed: Data.swapIdentity.swapData.preSeed,
        status: Data.swapIdentity.swapData.status,
        acceptedPayement: Data.acceptedPayement,
    };
    // initSwapData.items = [];
    const balanceSda = await Data.program.provider.connection.getBalance(
        Data.swapIdentity.swapDataAccount_publicKey
    );
    // console.log("Data.swapIdentity.swapData.preSeed", Data.swapIdentity.swapData.preSeed);

    if (balanceSda === 0) {
        // console.log(Data.swapIdentity.swapDataAccount_seed);
        // console.log(Data.swapIdentity.swapDataAccount_bump);
        // console.log(initSwapData);
        // console.log(Data.swapIdentity.swapDataAccount_publicKey.toBase58());
        // console.log(Data.signer.toBase58());
        // console.log(SystemProgram.programId.toBase58());
        return (
            Data.program.methods
                .initInitialize(
                    Data.swapIdentity.swapDataAccount_seed,
                    // Data.swapIdentity.swapDataAccount_bump,
                    initSwapData
                    // initSwapData.nbItems
                    // initSwapData.preSeed
                )
                .accounts({
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    systemProgram: SystemProgram.programId.toBase58(),
                    // splTokenProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                })
                // .signers([signer])
                .instruction()
        );
    } else {
        console.log("swap Account already initialized");
        return undefined;
    }
}

async function getAddInitilizeInstructions(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}): Promise<ErrorFeedback | TransactionInstruction[][] | undefined> {
    const bcData = await getSwapDataAccountFromPublicKey({
        program: Data.program,
        swapDataAccount_publicKey: Data.swapIdentity.swapDataAccount_publicKey,
    });
    // console.log("bcData", bcData);
    // console.log("Data.swapIdentity.swapData.items", Data.swapIdentity.swapData.items);

    let out = [];
    let chunkSize = 6;
    let returnData: (ErrorFeedback | undefined)[] = [];
    for (let index = 0; index < Data.swapIdentity.swapData.items.length; index += chunkSize) {
        const chunkIx: TransactionInstruction[] = [];
        returnData = await Promise.all(
            Data.swapIdentity.swapData.items.slice(index, index + chunkSize).map(async (item) => {
                let addTx = true;
                bcData?.items.forEach((itemSDA) => {
                    // console.log("itemSDA", itemSDA);

                    if (
                        itemSDA.mint.equals(item.mint) ||
                        itemSDA.owner.equals(item.owner) ||
                        itemSDA.destinary.equals(item.destinary)
                    ) {
                        console.log("already there", itemSDA);
                        addTx = false;
                    }
                });
                const tokenAccount = await findOrCreateAta({
                    mint: item.mint,
                    owner: item.owner,
                    program: Data.program,
                    signer: Data.signer,
                });
                if (item.status !== ItemStatus.SolToClaim) {
                    const balance = await Data.program.provider.connection.getTokenAccountBalance(
                        tokenAccount.mintAta
                    );
                    // console.log("balance: ", balance, tokenAccount.mintAta.toBase58());

                    if (!balance.value.uiAmount) {
                        return [
                            {
                                blockchain: "solana",
                                order: 0,
                                type: "error",
                                description: `cannot retrieve the balance of ${tokenAccount.mintAta.toBase58()}`,
                            },
                        ] as ErrorFeedback;
                    } else if (balance.value.uiAmount < item.amount.toNumber()) {
                        console.log("not ehough tokens");

                        return [
                            {
                                blockchain: "solana",
                                order: 0,
                                type: "error",
                                description: `found ${
                                    balance.value.uiAmount
                                } / ${item.amount.toNumber()}  in the associated token account ${tokenAccount.mintAta.toBase58()} linked to mint ${item.mint.toBase58()}`,
                            },
                        ] as ErrorFeedback;
                    }
                }
                if (addTx) {
                    chunkIx.push(
                        await Data.program.methods
                            .initializeAdd(
                                Data.swapIdentity.swapDataAccount_seed,
                                // Data.swapIdentity.swapDataAccount_bump,
                                item
                            )
                            .accounts({
                                swapDataAccount:
                                    Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                                signer: Data.signer.toBase58(),
                            })
                            // .signers([signer])
                            .instruction()
                    );
                }
            })
        );
        if (chunkIx) out.push(chunkIx);
    }
    let errorFeedback: ErrorFeedback = [
        {
            blockchain: "solana",
            type: "error",
            order: 0,
            description: "",
        },
    ];
    for (let index = 0; index < returnData.length; index++) {
        const element = returnData[index];
        if (element) {
            errorFeedback[0].description =
                String(errorFeedback[0].description) + `  /\/\  ` + String(element[0].description);

            // return element;
        }
    }

    if (errorFeedback[0].description !== "") {
        return errorFeedback;
    }
    let ll = 0;
    out.forEach((chunk) => {
        // console.log("chunk", chunk);
        ll += chunk.length;
    });
    console.log("there is ", ll, " items to deposit");
    if (ll > 0) {
        return out;
    } else {
        return undefined;
    }
}

async function getValidateInitilizeInstruction(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}) {
    return (
        Data.program.methods
            .validateInitialize(
                Data.swapIdentity.swapDataAccount_seed
                // Data.swapIdentity.swapDataAccount_bump
            )
            .accounts({
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                signer: Data.signer.toBase58(),
            })
            // .signers([signer])
            .instruction()
    );
}
