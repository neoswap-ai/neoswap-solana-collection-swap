import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";

export async function cancelSwap(
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
                await createCancelSwapInstructions({
                    swapDataAccount: Data.swapDataAccount,
                    signer: Data.signer.publicKey.toString(),
                    fees: Data.fees,
                    program,
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
