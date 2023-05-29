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
import { ErrorFeedback, SwapData, SwapIdentity, TxWithSigner } from "../utils/types";
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
    | ErrorFeedback
> {
    if (!Data.swapData.preSeed) Data.swapData.preSeed = "0000";
    const program = getProgram(Data.cluster);

    const swapIdentity = getSwapIdentityFromData({
        swapData: Data.swapData,
        // preSeed: Data.preSeed,
    });
    console.log("swapIdentity", swapIdentity);

    try {
        // console.log("swapIdentity before init", swapIdentity);
        const initInstruction = await getInitInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
        });
        // console.log("swapIdentity before add", initInstruction);

        const addInstructions = await getAddInitilizeInstructions({
            program,
            swapIdentity,
            signer: Data.signer,
        });
        console.log("addInstructions", addInstructions);
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
            console.log("Ainitialize swap skipped");
        }

        if (addInstructions) {
            if (isErrorAddInit(addInstructions)) {
                console.log("isErrorAddInit");

                return addInstructions;
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

        if (validateInstruction) {
            transactions.push({
                tx: new Transaction().add(validateInstruction),
                // signers: [signer],
            });
        } else {
            throw "nothing to initialize";
        }

        return {
            swapIdentity,
            programId: program.programId.toBase58(),
            transactions,
        };
    } catch (error) {
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
    // swapData: SwapData;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}) {
    // Data.swapIdentity.swapData.nbItems = Data.swapIdentity.swapData.items.length;
    let initSwapData: SwapData = {
        initializer: Data.swapIdentity.swapData.initializer,
        items: [],
        nbItems: Data.swapIdentity.swapData.nbItems,
        preSeed: Data.swapIdentity.swapData.preSeed,
        status: Data.swapIdentity.swapData.status,
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
                    Data.swapIdentity.swapDataAccount_bump,
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
    const bcData = await getSwapDataAccountFromPublicKey(
        Data.program,
        Data.swapIdentity.swapDataAccount_publicKey
    );
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
                const balance = await Data.program.provider.connection.getTokenAccountBalance(
                    tokenAccount.mintAta
                );
                console.log("balance: ", balance, tokenAccount.mintAta.toBase58());

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
                if (addTx) {
                    chunkIx.push(
                        await Data.program.methods
                            .initializeAdd(
                                Data.swapIdentity.swapDataAccount_seed,
                                Data.swapIdentity.swapDataAccount_bump,
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
    if (out.length > 0) return out;
    return undefined;
}

async function getValidateInitilizeInstruction(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}) {
    return (
        Data.program.methods
            .validateInitialize(
                Data.swapIdentity.swapDataAccount_seed,
                Data.swapIdentity.swapDataAccount_bump
            )
            .accounts({
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                signer: Data.signer.toBase58(),
            })
            // .signers([signer])
            .instruction()
    );
}
