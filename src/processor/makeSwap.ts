import { Keypair } from "@solana/web3.js";
import { BundleTransaction, EnvOpts, ErrorFeedback, MakeSArg, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { checkEnvOpts, checkOptionSend, getMakeArgs } from "../utils/check";

export async function makeSwap(
    Data: OptionSend &
        Omit<MakeSArg, "maker"> & {
            maker: Keypair;
        }
): Promise<{ bundleTransaction: BundleTransaction; swapDataAccount: string }> {
    let optionSend = checkOptionSend(Data);
    let makeArgs = getMakeArgs(Data);
    let cEnvOpts = checkEnvOpts(Data);

    let sda = "NOSDA";

    try {
        const { bTx, swapDataAccount } = await createMakeSwapInstructions({
            ...makeArgs,
            ...cEnvOpts,
        });
        sda = swapDataAccount;

        return {
            bundleTransaction: await sendSingleBundleTransaction({
                bt: bTx,
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
