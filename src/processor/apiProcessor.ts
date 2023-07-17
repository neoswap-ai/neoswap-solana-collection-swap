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
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    let apiProcessorData = await apiProcessorTranscript({
        config: Data.apiProcessorData.config,
    });

    const transactionHashs = await sendBundledTransactions({
        txsWithoutSigners: apiProcessorData,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: !Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
