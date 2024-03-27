import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";
import { checkEnvOpts, checkOptionSend, getClaimArgs, getTakeArgs } from "../utils/check";

export async function takeSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<string> {
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);
    let takeArgs = getTakeArgs(Data);

    try {
        return await sendSingleTransaction({
            tx: (
                await createTakeSwapInstructions({
                    ...takeArgs,
                    ...cEnvOpts,
                })
            ).tx,
            signer: Data.taker,
            ...cOptionSend,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
