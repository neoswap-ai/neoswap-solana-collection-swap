import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";

import { createTakeAndCloseSwapInstructions } from "../programInstructions/takeAndCloseSwap.instructions";

export async function takeAndCloseSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.taker });

    try {
        return await sendBundledTransactions({
            provider: program.provider as AnchorProvider,
            txsWithoutSigners: await createTakeAndCloseSwapInstructions({
                swapDataAccount: Data.swapDataAccount,
                taker: Data.taker.publicKey.toString(),
                nftMintTaker: Data.nftMintTaker,
                bid: Data.bid,
                program,
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
