import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback } from "../utils/types";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function depositSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    cluster: Cluster | string;
    skipSimulation?: boolean;
}): Promise<string[]> {
    let depositSwapData = await createDepositSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        user: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    try {
        const { transactionHashs } = await sendBundledTransactions({
            txsWithoutSigners: depositSwapData,
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
        return transactionHashs;
    } catch (error) {
        throw { blockchain: "solana", order: 0, status: "error", message: error } as ErrorFeedback;
    }
}
