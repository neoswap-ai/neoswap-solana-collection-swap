import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { createModifySwapInstructions } from "../programInstructions/modifySwap.instructions";
import { createClaimAndCloseSwapInstructions } from "../programInstructions/claim&close.instructions";

export async function claimAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    skipFinalize?: boolean;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    const transactionHashs = await sendBundledTransactions({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners: await createClaimAndCloseSwapInstructions({
            program,
            signer: Data.signer.publicKey,
            swapDataAccount: Data.swapDataAccount,
            skipFinalize: Data.skipFinalize,
        }),
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
