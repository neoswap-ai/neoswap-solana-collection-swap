import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import {
    Bid,
    BundleTransaction,
    CEnvOpts,
    EnvOpts,
    ErrorFeedback,
    OptionSend,
    TakeSArg,
} from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
    sendBundledTransactions,
    sendBundledTransactionsV2,
} from "../utils/sendBundledTransactions.function";

import { createTakeAndCloseSwapInstructions } from "../programInstructions/takeAndCloseSwap.instructions";
import { checkEnvOpts, checkOptionSend, getTakeArgs } from "../utils/check";

export async function takeAndCloseSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<BundleTransaction[]> {
    let takeArgs = getTakeArgs(Data);
    let optionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);

    try {
        return await sendBundledTransactionsV2({
            signer: Data.taker,
            bundleTransactions: await createTakeAndCloseSwapInstructions({
                ...takeArgs,
                ...cEnvOpts,
            }),
            ...optionSend,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
