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
import { SwapData, SwapIdentity } from "../utils/types";
import { Program } from "@project-serum/anchor";

export async function createInitializeSwapInstructions(Data: {
    swapData: SwapData;
    signer: PublicKey;
    // preSeed: string;
    cluster: Cluster | string;
}) {
    if (!Data.swapData.preSeed) Data.swapData.preSeed = "0000";
    const { program } = getProgram(Data.cluster);

    const swapIdentity = await getSwapIdentityFromData({
        swapData: Data.swapData,
        // preSeed: Data.preSeed,
    });

    try {
        const initInstruction = await getInitInitilizeInstruction({
            program,
            swapIdentity,
            signer: Data.signer,
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

        let transactions = [];

        if (initInstruction) {
            transactions.push({
                tx: new Transaction().add(initInstruction),
                // signers: [signer],
            });
        }

        if (addInstructions) {
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
        throw {
            message: error,
            programId: program.programId.toBase58(),
            ...swapIdentity,
        };
    }
}

async function getInitInitilizeInstruction(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
}) {
    let { status, initializer, items } = Data.swapIdentity.swapData;
    const num_items = items.length;
    const initSwapData = {
        status,
        initializer,
        items: [],
    };

    const balanceSda = await Data.program.provider.connection.getBalance(
        Data.swapIdentity.swapDataAccount_publicKey
    );
    if (balanceSda === 0) {
        return (
            Data.program.methods
                .initInitialize(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump,
                    initSwapData,
                    num_items
                )
                .accounts({
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    systemProgram: SystemProgram.programId.toBase58(),
                    splTokenProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
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
}) {
    const bcData = await getSwapDataAccountFromPublicKey(
        Data.program,
        Data.swapIdentity.swapDataAccount_publicKey
    );

    let out = [];
    let chunkSize = 6;

    for (let index = 0; index < Data.swapIdentity.swapData.items.length; index += chunkSize) {
        const chunkIx: TransactionInstruction[] = [];
        await Promise.all(
            Data.swapIdentity.swapData.items.slice(index, index + chunkSize).map(async (item) => {
                let addTx = true;
                bcData?.items.forEach((itemSDA) => {
                    if (
                        itemSDA.mint.equals(item.mint) ||
                        itemSDA.owner.equals(item.owner) ||
                        itemSDA.destinary.equals(item.destinary)
                    ) {
                        // console.log("already there");
                        addTx = false;
                    }
                });

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
