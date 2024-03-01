import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";

export async function makeSwap(Data: {
    maker: Keypair;
    nftMintMaker: PublicKey;
    paymentMint: PublicKey;
    bid: Bid;
    endDate: number;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<{ hash: string; swapDataAccount: string }> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.maker });

    const { tx, swapDataAccount } = await createMakeSwapInstructions({
        program,
        maker: Data.maker.publicKey,
        bid: Data.bid,
        endDate: Data.endDate,
        nftMintMaker: Data.nftMintMaker,
        paymentMint: Data.paymentMint,
    });
    try {
        const hash = await sendSingleTransaction({
            provider: program.provider as AnchorProvider,
            tx,
            signer: Data.maker,
            clusterOrUrl: Data.clusterOrUrl,
            skipSimulation: Data.skipSimulation,
            skipConfirmation: Data.skipConfirmation,
        });

        return {
            hash,
            swapDataAccount: swapDataAccount.toString(),
        };
    } catch (error) {
        throw {
            blockchain: "solana",
            message: swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
