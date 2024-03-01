import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, MakeSArg, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";

export async function makeSwap(
    Data: OptionSend &
        MakeSArg & {
            maker: Keypair;
        }
): Promise<{ hash: string; swapDataAccount: string }> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.maker });

    const { bTx, swapDataAccount } = await createMakeSwapInstructions({
        program,
        maker: Data.maker.publicKey.toString(),
        bid: Data.bid,
        endDate: Data.endDate,
        nftMintMaker: Data.nftMintMaker,
        paymentMint: Data.paymentMint,
    });
    try {
        const hash = await sendSingleTransaction({
            provider: program.provider as AnchorProvider,
            tx: bTx.tx,
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
