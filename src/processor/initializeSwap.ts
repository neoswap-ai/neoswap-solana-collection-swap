import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { SwapData } from "../utils/types";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}) {
    const initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        // preSeed: Data.preSeed,
        cluster: Data.cluster,
    });
    // console.log("initSwapData", initSwapData);
    const transactionHashes = await sendBundledTransactions({
        txsWithoutSigners: initSwapData.transactions,
        signer: Data.signer,
        cluster: Data.cluster,
    });
    // console.log("transactionHashes", transactionHashes);
    return { ...initSwapData, transactionHashes };
}
