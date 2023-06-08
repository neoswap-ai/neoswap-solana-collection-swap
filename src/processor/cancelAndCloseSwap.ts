import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, TxWithSigner } from "../utils/types";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";
import { isError, isErrorTxSigner } from "../utils/isError.function";
import { createValidateCanceledInstructions } from "../programInstructions/subFunction/validateCanceled.instructions";

export async function cancelAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}): Promise<string[] | ErrorFeedback> {
    let txToSend: TxWithSigner = [];

    let cancelTxData = await createCancelSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });
    // console.log("cancelTxData", cancelTxData);

    if (!isErrorTxSigner(cancelTxData)) {
        if (cancelTxData[0].tx.instructions.length > 0) {
            txToSend.push(...cancelTxData);
            console.log("found ", cancelTxData.length, " items to cancel");
        } else {
            console.log("skip cancel but signer is initializer");
        }
    } else return cancelTxData;

    let validateCancelTxData = await createValidateCanceledInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    if (!isErrorTxSigner(validateCancelTxData)) {
        txToSend.push(...validateCancelTxData);
    } else if (validateCancelTxData[0].description === "Signer is not the initializer") {
        console.log("skip validateCancel");
    } else return validateCancelTxData;

    // console.log("sending ", txToSend.length, " transactions to blockchain ...");

    const { transactionHashes } = await sendBundledTransactions({
        txsWithoutSigners: txToSend,
        signer: Data.signer,
        cluster: Data.cluster,
    });

    return transactionHashes;
}
