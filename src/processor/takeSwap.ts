import { Cluster, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, BundleTransaction, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";
import { checkEnvOpts, checkOptionSend, getClaimArgs, getTakeArgs } from "../utils/check";

export async function takeSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<BundleTransaction> {
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = await checkEnvOpts(Data);
    let takeArgs = getTakeArgs(Data);

    try {
        return await sendSingleBundleTransaction({
            ...cOptionSend,
            signer: Data.taker,
            bt: await createTakeSwapInstructions({
                ...cEnvOpts,
                ...takeArgs,
            }),
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
