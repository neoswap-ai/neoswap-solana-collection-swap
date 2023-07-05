import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, SwapData, SwapIdentity } from "../utils/types";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    confirmTransaction?: boolean;
}): Promise<{
    programId: string;
    swapIdentity: SwapIdentity;
    transactionHashs: string[];
}> {
    let initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
    });
    try {
        const transactionHashs = await sendBundledTransactions({
            txsWithoutSigners: initSwapData.transactions,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            simulation: Data.simulation,
        });
        if (Data.confirmTransaction) {
            const confirmArray = await isConfirmedTx({ clusterOrUrl: Data.clusterOrUrl, transactionHashs });
            confirmArray.forEach((confirmTx) => {
                if (!confirmTx.isConfirmed)
                    throw {
                        blockchain: "solana",
                        status: "error",
                        message: `some transaction were not confirmed ${confirmArray}`,
                    } as ErrorFeedback;
            });
        }
        return {
            programId: initSwapData.programId,
            swapIdentity: initSwapData.swapIdentity,
            transactionHashs,
        };
    } catch (error) {
        throw {
            programId: initSwapData.programId,
            swapIdentity: initSwapData.swapIdentity,
            blockchain: "solana",
            status: "error",
            message: error,
        };
    }
}
