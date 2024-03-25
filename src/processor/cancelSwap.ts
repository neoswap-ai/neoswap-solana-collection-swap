import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, BundleTransaction, ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "../utils/sendSingleTransaction.function";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";
import { checkEnvOpts, checkOptionSend, getClaimArgs, getMakeArgs } from "../utils/check";

export async function cancelSwap(
    Data: OptionSend &
        Omit<ClaimArg, "signer"> & {
            signer: Keypair;
        }
): Promise<BundleTransaction> {
    let optionSend = checkOptionSend(Data);
    let claimArgs = getClaimArgs(Data);
    let cEnvOpts = checkEnvOpts(Data);

    try {
        return await sendSingleBundleTransaction({
            bt: await createCancelSwapInstructions({ ...claimArgs, ...cEnvOpts }),
            signer: Data.signer,
            ...optionSend,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
