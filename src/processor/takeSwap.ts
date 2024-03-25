import { Cluster, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, BundleTransaction, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";
import { checkEnvOpts, checkOptionSend, getTakeArgs } from "../utils/check";

export async function takeSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<BundleTransaction> {
    let takeArgs = getTakeArgs(Data);
    let { swapDataAccount } = takeArgs;
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);

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
            message: swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
