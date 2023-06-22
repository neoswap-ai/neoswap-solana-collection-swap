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
}): Promise<TxWithSigner> {
    try {
        const program = getProgram(Data.cluster);

        // console.log(programId);
        // const program = getEscrowProgramInstance();
        // console.log("programId", program.programId.toBase58());
        const swapData = await getSwapDataAccountFromPublicKey({
            program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
        if (!swapData) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message:
                        "Swap initialization in progress or not initialized. Please try again later.",
                },
            ];
        } else if (
            !(
                swapData.status === TradeStatus.Canceling ||
                swapData.status === TradeStatus.WaitingToDeposit
            )
        ) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: "Swap is't in the adequate status for Validate Cancel.",
                    swapStatus: swapData.status,
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
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message:
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
                            const claimNftData = await getCancelNftInstructions({
                                program,
                                owner: item.owner,
                                mint: item.mint,
                                signer: Data.signer,
                                swapIdentity,
                                ataList,
                            });
                            cancelTransactionInstruction.push({
                                tx: new Transaction().add(...claimNftData.instructions),
                            });
                            ataList.push(...claimNftData.newAtas);
                            console.log("cancelNftinstruction added", item.mint.toBase58());
                            break;

                        case false:
                            const claimSolData = await getCancelSolInstructions({
                                program: program,
                                user: item.owner,
                                signer: Data.signer,
                                swapIdentity,
                                ataList,
                                mint: item.mint,
                            });
                            cancelTransactionInstruction.push({
                                tx: new Transaction().add(...claimSolData.instructions),
                            });
                            ataList.push(...claimSolData.newAtas);

                            console.log("cancelSolinstruction added");
                            break;
                    }
                }
            }
        }

        if (cancelTransactionInstruction.length === 0 && !init) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: "No item to cancel",
                },
            ];
        } else {
            if (cancelTransactionInstruction.length === 0) {
                cancelTransactionInstruction.push({ tx: new Transaction() });
            }
            return cancelTransactionInstruction;
        }
    } catch (error) {
        throw [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message: error,
            },
        ];
    }
}
