import { Cluster, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getClaimNftInstructions } from "./subFunction/claim.nft.instructions";
import { getClaimSolInstructions } from "./subFunction/claim.sol.instructions";
import { ErrorFeedback, TradeStatus, TxWithSigner } from "../utils/types";

export async function createClaimSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner | ErrorFeedback | undefined> {
    try {
        const program = getProgram(Data.cluster);

        const swapData = await getSwapDataAccountFromPublicKey({
            program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
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
                swapData.status === TradeStatus.WaitingToClaim ||
                swapData.status === TradeStatus.WaitingToDeposit
            )
        ) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "Swap is't in the adequate status for Validate Claim.",
                    status: swapData.status,
                },
            ];
        }
        let init = false;
        if (swapData.initializer.equals(Data.signer)) {
            init = true;
        } else if (swapData.status !== TradeStatus.WaitingToClaim) {
            [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Swap is't in the adequate status for Claiming an item & you're not Initializer",
                    status: swapData.status,
                },
            ];
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
        // let depositInstructionTransaction: Array<TransactionInstruction> = [];
        let claimTransactionInstruction: TxWithSigner = [];
        let ataList: PublicKey[] = [];

        for (const item of swapData.items) {
            if (init === true || item.destinary.equals(Data.signer)) {
                switch (item.isNft) {
                    case true:
                        if (item.status === 20) {
                            const cllaimNftData = await getClaimNftInstructions({
                                program,
                                destinary: item.destinary,
                                mint: item.mint,
                                signer: Data.signer,
                                swapIdentity,
                                ataList,
                            });
                            claimTransactionInstruction.push({
                                tx: new Transaction().add(...cllaimNftData.instruction),
                            });
                            ataList.push(...cllaimNftData.newAtas);
                            console.log("claimNftinstruction added", item.mint.toBase58());
                        }
                        break;

                    case false:
                        if (item.status === 22) {
                            const claimSolData = await getClaimSolInstructions({
                                program: program,
                                user: item.owner,
                                signer: Data.signer,
                                swapIdentity,
                                ataList,
                                mint: item.mint,
                            });
                            claimTransactionInstruction.push({
                                tx: new Transaction().add(...claimSolData.instructions),
                            });
                            console.log("claimSolinstruction added");
                        }
                        break;
                }
            }
        }
        if (claimTransactionInstruction.length > 0) {
            return claimTransactionInstruction;
        } else {
            return undefined;
        }
    } catch (error) {
        return [{ blockchain: "solana", type: "error", order: 0, description: error }];
    }
}
