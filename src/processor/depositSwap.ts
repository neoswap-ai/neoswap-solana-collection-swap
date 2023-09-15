import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback } from "../utils/types";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@project-serum/anchor";

export async function depositSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });
    let depositSwapData = await createDepositSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        user: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });

    const transactionHashs = await sendBundledTransactions({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners: depositSwapData,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
