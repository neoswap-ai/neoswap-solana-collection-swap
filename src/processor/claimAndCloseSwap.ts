import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@project-serum/anchor";

export async function claimAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    let txToSend: TxWithSigner[] = [];
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });

    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });
    if (validateDepositTxData) txToSend.push(...validateDepositTxData);
    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });

    if (claimTxData) txToSend.push(...claimTxData);

    let validateClaimTxData = await createValidateClaimedInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });
    if (validateClaimTxData) txToSend.push(...validateClaimTxData);

    const transactionHashs = await sendBundledTransactions({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners: txToSend,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
