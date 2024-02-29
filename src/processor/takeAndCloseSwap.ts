import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, TxWithSigner } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";

export async function takeAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    taker: Keypair;
    nftMintTaker: PublicKey;
    bid: Bid;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.taker });

    let takeSwapTx = await createTakeSwapInstructions({
        program,
        taker: Data.taker.publicKey,
        bid: Data.bid,
        swapDataAccount: Data.swapDataAccount,
        nftMintTaker: Data.nftMintTaker,
    });
    let payRoyaltiesTx = await createPayRoyaltiesInstructions({
        program,
        taker: Data.taker.publicKey,
        nftMintTaker: Data.nftMintTaker,
        swapDataAccount: Data.swapDataAccount,
        bid: Data.bid,
    });
    let claimSwapTx = await createClaimSwapInstructions({
        program,
        taker: Data.taker.publicKey,
        // nftMintTaker: Data.nftMintTaker,
        clusterOrUrl: Data.clusterOrUrl,
        swapDataAccount: Data.swapDataAccount,
    });
    let txsWithoutSigners: TxWithSigner[] = [
        { tx: takeSwapTx },
        { tx: payRoyaltiesTx },
        { tx: claimSwapTx },
    ];
    try {
        return await sendBundledTransactions({
            provider: program.provider as AnchorProvider,
            txsWithoutSigners,
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
