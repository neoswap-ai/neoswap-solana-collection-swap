import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback } from "../utils/types";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function depositSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    let depositSwapData = await createDepositSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        user: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
    });

    const transactionHashs = await sendBundledTransactions({
        txsWithoutSigners: depositSwapData,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
