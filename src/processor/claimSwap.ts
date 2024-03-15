import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";

export async function claimSwap(
    Data: OptionSend &
        Omit<ClaimArg, "signer"> & {
            signer: Keypair;
        }
): Promise<string> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });
    try {
        return await sendSingleTransaction({
            connection: program.provider.connection,
            tx: (
                await createClaimSwapInstructions({
                    program,
                    swapDataAccount: Data.swapDataAccount,
                    signer: Data.signer.publicKey.toBase58(),
                    prioritizationFee: Data.prioritizationFee,
                })
            ).tx,
            signer: Data.signer,
            clusterOrUrl: Data.clusterOrUrl,
            skipSimulation: Data.skipSimulation,
            skipConfirmation: Data.skipConfirmation,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
