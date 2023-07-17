import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, InitializeData, SwapData, SwapIdentity } from "../utils/types";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function initializeSwap(Data: {
    swapData: SwapData;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<{
    initializeData: InitializeData;
    transactionHashs: string[];
}> {
    // console.log("swapData", Data.swapData);

    let initializeData = await createInitializeSwapInstructions({
        swapData: Data.swapData,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
    });
    try {
        const transactionHashs = await sendBundledTransactions({
            txsWithoutSigners: initializeData.txWithoutSigner,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            simulation: Data.simulation,
            skipConfirmation: Data.skipConfirmation,
        });

        return {
            initializeData,
            transactionHashs,
        };
    } catch (error) {
        throw {
            ...(error as any),
            ...{
                programId: initializeData.programId,
                swapIdentity: initializeData.swapIdentity,
                swapDataAccount: initializeData.swapIdentity.swapDataAccount_publicKey.toString(),
            },
        };
    }
}
