import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { InitializeData, SwapInfo } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createModifySwapInstructions } from "../programInstructions/modifySwap.instructions";

export async function initializeSwap(Data: {
    swapInfo: SwapInfo;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    validateOwnership?: "warning" | "error";
    validateOwnershipIgnore?: string[];
}): Promise<{
    initializeData: InitializeData;
    transactionHashs: string[];
}> {
    // console.log("swapData", Data.swapData);
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    let initializeData = await createModifySwapInstructions({
        swapInfo: Data.swapInfo,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
        validateOwnership: Data.validateOwnership,
        validateOwnershipIgnore: Data.validateOwnershipIgnore,
    });
    // if (initializeData.warning !== "" && Data.warningIsError) {
    //     console.log("WarningIsError is true and creating initializing data creates warning");
    //     throw initializeData.warning;
    // }
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
