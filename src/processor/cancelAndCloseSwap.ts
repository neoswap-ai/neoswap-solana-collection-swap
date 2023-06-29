import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, TxWithSigner } from "../utils/types";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";
import { createValidateCanceledInstructions } from "../programInstructions/subFunction/validateCanceled.instructions";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function cancelAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    cluster: Cluster | string;
    skipSimulation?: boolean;
    // preSeed: string;
}): Promise<string[]> {
    let txToSend: TxWithSigner = [];

    let cancelTxData = await createCancelSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });
    // console.log("cancelTxData", cancelTxData);

    if (cancelTxData) txToSend.push(...cancelTxData);

    let validateCancelTxData = await createValidateCanceledInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    if (validateCancelTxData) txToSend.push(...validateCancelTxData);

    const { transactionHashs } = await sendBundledTransactions({
        txsWithoutSigners: txToSend,
        signer: Data.signer,
        cluster: Data.cluster,
        skipSimulation: Data.skipSimulation,
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
}
