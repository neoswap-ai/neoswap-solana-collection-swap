import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { SwapInfo } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";

export async function takeSwap(Data: {
    swapDataAccount: PublicKey;
    swapInfo: SwapInfo;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });
    return await sendBundledTransactions({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners: await createTakeSwapInstructions({
            program,
            swapDataAccount: Data.swapDataAccount,
            signer: Data.signer.publicKey,
            swapInfo: Data.swapInfo,
        }),
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });
}
