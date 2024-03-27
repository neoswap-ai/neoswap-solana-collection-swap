import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createCancelSwapInstructions } from "../programInstructions/cancelSwap.instructions";
import { checkEnvOpts, checkOptionSend, getClaimArgs } from "../utils/check";

export async function cancelSwap(
    Data: OptionSend &
        Omit<ClaimArg, "signer"> & {
            signer: Keypair;
        }
): Promise<string> {
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);
    let claimArgs = getClaimArgs(Data);

    try {
        return await sendSingleTransaction({
            tx: (
                await createCancelSwapInstructions({
                    ...claimArgs,
                    ...cEnvOpts,
                })
            ).tx,
            signer: Data.signer,
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
