import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ApiProcessorConfigType, ApiProcessorData, ErrorFeedback } from "../utils/types";
// import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";
import { apiProcessorTranscript } from "../programInstructions/apiProcessor.transcript";

export async function apiProcessor(Data: {
    clusterOrUrl: Cluster | string;
    apiProcessorData: ApiProcessorData;
    signer: Keypair;
    // swapDataAccount: PublicKey;
    skipSimulation?: boolean;
    confirmTransaction?: boolean;
}): Promise<string[]> {
    let apiProcessorData = await apiProcessorTranscript({
        config: Data.apiProcessorData.config,
    });

    try {
        const transactionHashs = await sendBundledTransactions({
            txsWithoutSigners: apiProcessorData,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            skipSimulation: Data.skipSimulation,
        });
        if (Data.confirmTransaction) {
            const confirmArray = await isConfirmedTx({
                clusterOrUrl: Data.clusterOrUrl,
                transactionHashs,
            });
            confirmArray.forEach((confirmTx) => {
                if (!confirmTx.isConfirmed)
                    throw {
                        blockchain: "solana",
                        status: "error",
                        message: `some transaction were not confirmed ${confirmArray}`,
                    } as ErrorFeedback;
            });
        }
        return transactionHashs;
    } catch (error) {
        throw { blockchain: "solana", order: 0, status: "error", message: error } as ErrorFeedback;
    }
}
