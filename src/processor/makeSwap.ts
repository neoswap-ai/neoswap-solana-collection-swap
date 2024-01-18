import { Cluster, Keypair } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, SwapInfo } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";

export async function makeSwap(Data: {
    swapInfo: SwapInfo;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    skipFinalize?: boolean;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<{ hashs: string[]; swapDataAccount: string; programId: string }> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });
    const { txWithoutSigner, swapIdentity, programId } = await createMakeSwapInstructions({
        program,
        signer: Data.signer.publicKey,
        swapInfo: Data.swapInfo,
    });
    try {
        const hashs = await sendBundledTransactions({
            provider: program.provider as AnchorProvider,
            txsWithoutSigners: txWithoutSigner,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            simulation: Data.simulation,
            skipConfirmation: Data.skipConfirmation,
        });

        return {
            hashs,
            swapDataAccount: swapIdentity.swapDataAccount_publicKey.toString(),
            programId: programId.toString(),
        };
    } catch (error) {
        throw {
            blockchain: "solana",
            message: swapIdentity.swapDataAccount_publicKey.toString() + error,
            status: "error",
        } as ErrorFeedback;
    }
}
