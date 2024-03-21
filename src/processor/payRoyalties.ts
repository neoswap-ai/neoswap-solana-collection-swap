import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { ClaimArg, ErrorFeedback, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";
import { checkOptionSend } from "../utils/check";

export async function payRoyalties(
    Data: OptionSend &
        Omit<ClaimArg, "signer"> & {
            signer: Keypair;
        }
): Promise<string> {
    let optionSend = checkOptionSend(Data);
    let { clusterOrUrl } = optionSend;
    const program = getProgram({ clusterOrUrl, signer: Data.signer });
    try {
        return await sendSingleTransaction({
            tx: {
                tx: (
                    await createPayRoyaltiesInstructions({
                        program,
                        swapDataAccount: Data.swapDataAccount,
                        signer: Data.signer.publicKey.toString(),
                        prioritizationFee: Data.prioritizationFee,
                    })
                ).tx,
                signers: [Data.signer],
            },
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
