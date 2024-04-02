import { Keypair } from "@solana/web3.js";
import { BundleTransaction, ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { sendSingleBundleTransaction } from "../utils/sendSingleTransaction.function";
import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";
import { checkEnvOpts, checkOptionSend, getClaimArgs } from "../utils/check";

export async function payRoyalties(
    Data: OptionSend &
        Omit<ClaimArg, "signer"> & {
            signer: Keypair;
        }
): Promise<BundleTransaction> {
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);
    let claimArgs = getClaimArgs(Data);

    try {
        return await sendSingleBundleTransaction({
            ...cOptionSend,
            signer: Data.signer,
            bt: await createPayRoyaltiesInstructions({
                ...cEnvOpts,
                ...claimArgs,
            }),
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
