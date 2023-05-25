import { Cluster, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, SwapData, SwapIdentity, TxWithSigner } from "../utils/types";
import { isError, isErrorInit } from "../utils/isError.function";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}): Promise<
    | {
          programId: string;
          swapIdentity: SwapIdentity;
          transactionHashes: string[];
      }
    | ErrorFeedback
> {
    let initSwapData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        // preSeed: Data.preSeed,
        cluster: Data.cluster,
    });
    // console.log("initSwapData", initSwapData);

    if (isErrorInit(initSwapData)) return initSwapData;

    const { transactionHashes } = await sendBundledTransactions({
        txsWithoutSigners: initSwapData.transactions,
        signer: Data.signer,
        cluster: Data.cluster,
    });
    // delete initSwapData.transactions;
    // console.log("transactionHashes", transactionHashes);
    return { ...initSwapData, transactionHashes };
}
