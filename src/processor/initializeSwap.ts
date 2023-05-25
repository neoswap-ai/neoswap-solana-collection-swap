import { Cluster, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { SwapData, SwapIdentity } from "../utils/types";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}): Promise<{
    programId: string;
    swapIdentity: SwapIdentity;
    transactionHashes: string[];
}> {
    let initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        // preSeed: Data.preSeed,
        cluster: Data.cluster,
    });
    // console.log("initSwapData", initSwapData);
    const { transactionHashes } = await sendBundledTransactions({
        txsWithoutSigners: initSwapData.transactions,
        signer: Data.signer,
        cluster: Data.cluster,
    });
    // delete initSwapData.transactions;
    // console.log("transactionHashes", transactionHashes);
    return { ...initSwapData, transactionHashes };
}
