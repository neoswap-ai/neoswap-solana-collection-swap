import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { isError } from "../utils/isError.function";

export async function claimAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    cluster: Cluster | string;
    // preSeed: string;
}): Promise<string[] | ErrorFeedback> {
    // | ErrorFeedback
    let txToSend: TxWithSigner = [];
    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });
    if (!validateDepositTxData) {
    } else if (!isError(validateDepositTxData)) {
        txToSend.push(...validateDepositTxData);
    } else if (
        validateDepositTxData[0].description === "Signer is not the initializer" ||
        validateDepositTxData[0].description === "WaitingToClaim state"
    ) {
        console.log("skip validateDeposited");
    } else return validateDepositTxData;

    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    if (!claimTxData) {
    } else if (!isError(claimTxData)) {
        txToSend.push(...claimTxData);
        console.log("found ", claimTxData.length, " items to claim");
    } else return claimTxData;

    let validateClaimTxData = await createValidateClaimedInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    if (!isError(validateClaimTxData)) {
        txToSend.push(...validateClaimTxData);
    } else if (validateClaimTxData[0].description === "Signer is not the initializer") {
        console.log("skip validateClaimed");
    } else return validateClaimTxData;

    
    const { transactionHashes } = await sendBundledTransactions({
        txsWithoutSigners: txToSend,
        signer: Data.signer,
        cluster: Data.cluster,
    });

    return transactionHashes;
}
