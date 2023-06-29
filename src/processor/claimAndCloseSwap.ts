import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { ErrorFeedback, TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { isConfirmedTx } from "../utils/isConfirmedTx.function";

export async function claimAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    signer: Keypair;
    cluster: Cluster | string;
    skipSimulation?: boolean;
}): Promise<string[]> {
    let txToSend: TxWithSigner = [];
    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });
    if (validateDepositTxData) {
        txToSend.push(...validateDepositTxData);
    }

    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });

    if (claimTxData) {
        txToSend.push(...claimTxData);
        console.log("found ", claimTxData.length, " items to claim");
    }

    let validateClaimTxData = await createValidateClaimedInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer.publicKey,
        cluster: Data.cluster,
    });
    if (validateClaimTxData) txToSend.push(...validateClaimTxData);

    const { transactionHashs } = await sendBundledTransactions({
        txsWithoutSigners: txToSend,
        signer: Data.signer,
        cluster: Data.cluster,
    });
    if (Data.skipSimulation) {
        const confirmArray = await isConfirmedTx({ cluster: Data.cluster, transactionHashs });
        confirmArray.forEach((confirmTx) => {
            if (!confirmTx.isConfirmed)
                throw {
                    blockchain: "solana",
                    status: "error",
                    message: `some transaction were not confirmed ${confirmArray}`,
                } as ErrorFeedback;
        });
    }

    return transactionHashs;
}
