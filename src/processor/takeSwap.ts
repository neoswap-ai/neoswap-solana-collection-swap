import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";

export async function takeSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<string> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.taker });

    try {
        return await sendSingleTransaction({
            provider: program.provider as AnchorProvider,
            tx: (
                await createTakeSwapInstructions({
                    program,
                    taker: Data.taker.publicKey.toString(),
                    bid: Data.bid,
                    swapDataAccount: Data.swapDataAccount,
                    nftMintTaker: Data.nftMintTaker,
                })
            ).tx,
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
