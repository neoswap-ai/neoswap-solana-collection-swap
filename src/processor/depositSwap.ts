import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, TxWithSigner } from "../utils/types";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { isError, isErrorTxSigner } from "../utils/isError.function";

export async function depositSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}): Promise<{
    txInit: string;
    txsAdd: string[];
    txValidate: string;
}> {
    // | ErrorFeedback
    let depositSwapData = await createDepositSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        user: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    // if (!isErrorTxSigner(depositSwapData)) {
    // console.log(
    //     "User ",
    //     Data.signer.publicKey.toBase58(),
    //     " has found to have ",
    //     depositSwapData.length,
    //     " items to deposit\nBroadcasting to blockchain ..."
    // );
    try {
        const { transactionHashes } = await sendBundledTransactions({
            txsWithoutSigners: depositSwapData,
            signer: Data.signer,
            cluster: Data.cluster,
        });

        let txInit = transactionHashes.slice(0, 1).pop();
        let txsAdd = transactionHashes.slice(1, -1);
        let txValidate = transactionHashes.slice(-1).pop();
        if (txInit && txValidate) {
            let txInitialize = {
                txInit,
                txsAdd,
                txValidate,
            };

            return txInitialize;
        } else {
            throw [
                {
                    blockchain: "solana",
                    order: 0,
                    status: "error",
                    message: `missing some transactions ${transactionHashes}`,
                },
            ] as ErrorFeedback;
        }
    } catch (error) {
        throw [
            { blockchain: "solana", order: 0, status: "error", message: error },
        ] as ErrorFeedback;
    }
    // } else return depositSwapData;
}
