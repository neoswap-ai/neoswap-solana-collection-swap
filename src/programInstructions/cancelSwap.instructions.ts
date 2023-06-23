import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getCancelNftInstructions } from "./subFunction/cancel.nft.instructions";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getCancelSolInstructions } from "./subFunction/cancel.sol.instructions";
import { Cluster, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ErrorFeedback, ItemStatus, TradeStatus, TxWithSigner } from "../utils/types";

export async function createCancelSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner | undefined> {
    try {
        const program = getProgram(Data.cluster);

        const swapData = await getSwapDataAccountFromPublicKey({
            program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
        if (!swapData) {
            throw {
                blockchain: "solana",
                status: "error",
                message:
                    "Swap initialization in progress or not initialized. Please try again later.",
            } as ErrorFeedback;
        } else if (
            !(
                swapData.status === TradeStatus.Canceling ||
                swapData.status === TradeStatus.WaitingToDeposit
            )
        ) {
            throw {
                blockchain: "solana",
                status: "error",
                message: "Swap is't in the adequate status for Validate Cancel.",
                swapStatus: swapData.status,
            } as ErrorFeedback;
        }
        let init = false;
        if (swapData.initializer.equals(Data.signer)) {
            init = true;
            console.log("initializer");
        }

        const swapIdentity = getSwapIdentityFromData({
            swapData,
        });

        let cancelTransactionInstruction: TxWithSigner = [];
        let ataList: PublicKey[] = [];
        let toBeCancelledItems = swapData.items.filter(
            (item) =>
                item.status === ItemStatus.NFTDeposited || item.status === ItemStatus.SolDeposited
        );
        if (!init)
            toBeCancelledItems = toBeCancelledItems.filter((item) =>
                item.owner.equals(Data.signer)
            );

        for (const swapDataItem of toBeCancelledItems) {
            if (swapDataItem.isNft) {
                console.log(
                    "XXX - cancel NFT item with mint ",
                    swapDataItem.mint.toBase58(),
                    " from ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );
                const cancelNftData = await getCancelNftInstructions({
                    program,
                    owner: swapDataItem.owner,
                    mint: swapDataItem.mint,
                    signer: Data.signer,
                    swapIdentity,
                    ataList,
                });
                cancelTransactionInstruction.push({
                    tx: new Transaction().add(...cancelNftData.instructions),
                });
                ataList.push(...cancelNftData.newAtas);
            } else {
                console.log(
                    "XXX - cancel Sol item mint ",
                    swapDataItem.mint.toBase58(),
                    "to ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );
                const cancelSolData = await getCancelSolInstructions({
                    program: program,
                    user: swapDataItem.owner,
                    signer: Data.signer,
                    swapIdentity,
                    ataList,
                    mint: swapDataItem.mint,
                });
                cancelTransactionInstruction.push({
                    tx: new Transaction().add(...cancelSolData.instructions),
                });
                ataList.push(...cancelSolData.newAtas);
            }
        }

        if (cancelTransactionInstruction.length === 0 && init) {
            console.log(
                "no items found to cancel but initializer is proceeding to validate cancel"
            );
            return;
        } else if (cancelTransactionInstruction.length > 0) {
            console.log("found ", cancelTransactionInstruction.length, " items to cancel");
            return cancelTransactionInstruction;
        } else {
            throw {
                blockchain: "solana",
                status: "error",
                message: "found nothing to cancel and signer is not initializer",
            } as ErrorFeedback;
        }
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}
