import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";
import { checkOptionSend, checkEnvOpts, getClaimArgs } from "../utils/check";

export async function payRoyalties(
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
                await createPayRoyaltiesInstructions({
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
            message: Data.swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
