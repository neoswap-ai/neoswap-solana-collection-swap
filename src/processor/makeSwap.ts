import { Keypair } from "@solana/web3.js";
import { BundleTransaction, EnvOpts, ErrorFeedback, MakeSArg, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { checkEnvOpts, checkOptionSend, getMakeArgs } from "../utils/check";
import { sendBundledTransactionsV2 } from "../utils/sendBundledTransactions.function";

export async function makeSwap(
    Data: OptionSend &
        Omit<MakeSArg, "maker"> & {
            maker: Keypair;
        }
): Promise<{ bundleTransactions: BundleTransaction[]; swapDataAccount: string }> {
    let optionSend = checkOptionSend(Data);
    let makeArgs = getMakeArgs(Data);
    let cEnvOpts = checkEnvOpts(Data);

    let sda = "NOSDA";

    try {
        const { bTxs, swapDataAccount } = await createMakeSwapInstructions({
            ...makeArgs,
            ...cEnvOpts,
        });
        sda = swapDataAccount;

        return {
            bundleTransactions: await sendBundledTransactionsV2({
                bundleTransactions: bTxs,
                ...optionSend,
                signer: Data.maker,
            }),
            swapDataAccount,
        };
    } catch (error) {
        throw {
            blockchain: "solana",
            message: sda + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
