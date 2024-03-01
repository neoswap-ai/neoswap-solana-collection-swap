import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { ErrorFeedback } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";

export async function payRoyalties(Data: {
    swapDataAccount: string;
    taker: Keypair;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.taker });
    try {
        return await sendSingleTransaction({
            provider: program.provider as AnchorProvider,
            tx: await createPayRoyaltiesInstructions({
                program,
                taker: Data.taker.publicKey.toString(),
                swapDataAccount: Data.swapDataAccount,
            }),
            signer: Data.taker,
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
