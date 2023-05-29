import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getCancelNftInstructions } from "./subFunction/cancel.nft.instructions";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getCancelSolInstructions } from "./subFunction/cancel.sol.instructions";
import { Cluster, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ErrorFeedback, TradeStatus, TxWithSigner } from "../utils/types";

export async function createCancelSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner | ErrorFeedback> {
    try {
        const program= getProgram(Data.cluster);

        // console.log(programId);
        // const program = getEscrowProgramInstance();
        // console.log("programId", program.programId.toBase58());
        const swapData = await getSwapDataAccountFromPublicKey(program, Data.swapDataAccount);
        if (!swapData) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Swap initialization in progress or not initialized. Please try again later.",
                },
            ];
        } else if (
            !(
                swapData.status === TradeStatus.canceling ||
                swapData.status === TradeStatus.WaitingToDeposit
            )
        ) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "Swap is't in the adequate status for Validate Cancel.",
                    status: swapData.status,
                },
            ];
        }
        let init = false;
        if (swapData.initializer.equals(Data.signer)) {
            init = true;
            console.log("initializer");
        }
        const swapIdentity = getSwapIdentityFromData({
            swapData,
        });

        if (!swapIdentity)
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Data retrieved from the Swap did not allow to build the SwapIdentity.",
                },
            ];

        // console.log("swapIdentity", swapIdentity);
        let cancelTransactionInstruction: TxWithSigner = [];
        let ataList: PublicKey[] = [];

        for (const item of swapData.items) {
            // console.log("item.status", item.status);
            if (init === true || item.owner.equals(Data.signer)) {
                if ([20, 21].includes(item.status)) {
                    switch (item.isNft) {
                        case true:
                            const { instructions, newAtas } = await getCancelNftInstructions({
                                program,
                                owner: item.owner,
                                mint: item.mint,
                                signer: Data.signer,
                                swapIdentity,
                                ataList,
                            });
                            cancelTransactionInstruction.push({
                                tx: new Transaction().add(...instructions),
                            });
                            ataList.push(...newAtas);
                            console.log("cancelNftinstruction added", item.mint.toBase58());
                            break;

                        case false:
                            const { instruction } = await getCancelSolInstructions({
                                program: program,
                                user: item.owner,
                                signer: Data.signer,
                                swapIdentity,
                            });
                            cancelTransactionInstruction.push({
                                tx: new Transaction().add(instruction),
                            });
                            console.log("cancelSolinstruction added");
                            break;
                    }
                }
            }
        }

        if (cancelTransactionInstruction.length === 0 && !init) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "No item to cancel",
                },
            ];
        } else {
            if (cancelTransactionInstruction.length === 0) {
                cancelTransactionInstruction.push({ tx: new Transaction() });
            }
            return cancelTransactionInstruction;
        }
    } catch (error) {
        return [
            {
                blockchain: "solana",
                type: "error",
                order: 0,
                description: error,
            },
        ];
    }
}
