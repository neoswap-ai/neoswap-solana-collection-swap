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
}): Promise<string[] | ErrorFeedback> {
    let depositSwapData = await createDepositSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        user: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    if (!isErrorTxSigner(depositSwapData)) {
        // console.log(
        //     "User ",
        //     Data.signer.publicKey.toBase58(),
        //     " has found to have ",
        //     depositSwapData.length,
        //     " items to deposit\nBroadcasting to blockchain ..."
        // );

        const { transactionHashes } = await sendBundledTransactions({
            txsWithoutSigners: depositSwapData,
            signer: Data.signer,
            cluster: Data.cluster,
        });

        return transactionHashes;
    } else return depositSwapData;
}
