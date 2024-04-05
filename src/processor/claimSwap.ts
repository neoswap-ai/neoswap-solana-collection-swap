import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { BundleTransaction, ClaimSArg, ErrorFeedback, OptionSend } from "../utils/types";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { checkOptionSend, getTakeArgs, checkEnvOpts, getClaimSArgs } from "../utils/check";

export async function claimSwap(
    Data: OptionSend &
        Omit<ClaimSArg, "signer"> & {
            signer: Keypair;
        }
): Promise<BundleTransaction> {
    let ClaimSArgs = getClaimSArgs(Data);
    let optionSend = checkOptionSend(Data);
    let cEnvOpts = await checkEnvOpts(Data);
    let { swapDataAccount } = ClaimSArgs;

    try {
        return await sendSingleBundleTransaction({
            bt: await createClaimSwapInstructions({
                ...ClaimSArgs,
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
