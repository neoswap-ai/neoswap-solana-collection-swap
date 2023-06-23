import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, SwapData, SwapIdentity } from "../utils/types";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    cluster: Cluster | string;
    skipSimulation?: boolean;
}): Promise<
    | {
          programId: string;
          swapIdentity: SwapIdentity;
          transactionHashs: string[];
      }
    | {
          programId: string;
          swapIdentity?: SwapIdentity;
          error: ErrorFeedback;
      }
> {
    let initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });
    try {
        const { transactionHashs } = await sendBundledTransactions({
            txsWithoutSigners: initSwapData.transactions,
            signer: Data.signer,
            cluster: Data.cluster,
        });
        if (Data.skipSimulation) {
            const confirmArray = await isConfirmedTx({ cluster: Data.cluster, transactionHashs });
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
        return {
            programId: initSwapData.programId,
            swapIdentity: initSwapData.swapIdentity,
            error: { blockchain: "solana", status: "error", message: error } as ErrorFeedback,
        };
    }
}
