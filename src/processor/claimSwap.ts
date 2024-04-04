import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { BundleTransaction, ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { checkOptionSend, getTakeArgs, checkEnvOpts, getClaimArgs } from "../utils/check";

export async function claimSwap(
    Data: OptionSend &
        Omit<ClaimArg, "signer"> & {
            signer: Keypair;
        }
): Promise<BundleTransaction> {
    let claimArgs = getClaimArgs(Data);
    let optionSend = checkOptionSend(Data);
    let cEnvOpts = await checkEnvOpts(Data);
    let { swapDataAccount } = claimArgs;

    try {
        return await sendSingleBundleTransaction({
            bt: await createClaimSwapInstructions({
                ...claimArgs,
                ...cEnvOpts,
            }),
            signer: Data.signer,
            ...optionSend,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
