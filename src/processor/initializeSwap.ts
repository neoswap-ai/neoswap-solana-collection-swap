import { Cluster, Keypair } from "@solana/web3.js";
import { createInitializeSwapInstructions } from "../programInstructions/initializeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { InitializeData, SwapInfo } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@project-serum/anchor";

export async function initializeSwap(Data: {
    swapInfo: SwapInfo;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    warningIsError?: boolean;
}): Promise<{
    initializeData: InitializeData;
    transactionHashs: string[];
}> {
    // console.log("swapData", Data.swapData);
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    let initializeData = await createInitializeSwapInstructions({
        swapInfo: Data.swapInfo,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });
    if (initializeData.warning !== "" && Data.warningIsError) {
        console.log("WarningIsError is true and creating initializing data creates warning");
        throw initializeData;
    }
    try {
        const transactionHashs = await sendBundledTransactions({
            provider: program.provider as AnchorProvider,
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
        console.log("error", error);

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
