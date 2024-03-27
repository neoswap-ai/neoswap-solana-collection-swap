import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";

import { createTakeAndCloseSwapInstructions } from "../programInstructions/takeAndCloseSwap.instructions";
import { checkEnvOpts, checkOptionSend, getTakeArgs } from "../utils/check";

export async function takeAndCloseSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<string[]> {
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);
    let takeArgs = getTakeArgs(Data);

    try {
        return await sendBundledTransactions({
            txsWithoutSigners: await createTakeAndCloseSwapInstructions({
                ...takeArgs,
                ...cEnvOpts,
            }),
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
