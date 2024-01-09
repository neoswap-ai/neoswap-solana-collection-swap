import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { InitializeData, SwapInfo } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createModifySwapInstructions } from "../programInstructions/modifySwap.instructions";

export async function modifySwap(Data: {
    swapInfo: SwapInfo;
    swapDataAccount: PublicKey;
    signer: Keypair;
    // user: PublicKey;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    validateOwnership?: "warning" | "error";
    validateOwnershipIgnore?: string[];
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    let modifyData = await createModifySwapInstructions({
        swapInfo: Data.swapInfo,
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        // user: Data.user,
        clusterOrUrl: Data.clusterOrUrl,
        program,
        validateOwnership: Data.validateOwnership,
        validateOwnershipIgnore: Data.validateOwnershipIgnore,
    });

    const transactionHashs = await sendBundledTransactions({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners: modifyData,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
