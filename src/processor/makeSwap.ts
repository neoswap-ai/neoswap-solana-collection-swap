import { Keypair } from "@solana/web3.js";
import { EnvOpts, ErrorFeedback, MakeSArg, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { checkOptionSend, getMakeArgs } from "../utils/check";

export async function makeSwap(
    Data: OptionSend &
        Omit<MakeSArg, "maker"> & {
            maker: Keypair;
        }
): Promise<{ hash: string; swapDataAccount: string }> {
    let { maker } = Data;

    let optionSend = checkOptionSend(Data);
    let { clusterOrUrl, prioritizationFee } = optionSend;

    let makeArgs = getMakeArgs(Data);

    const program = getProgram({ clusterOrUrl: clusterOrUrl, signer: maker });
    let envOpts: EnvOpts = { clusterOrUrl, prioritizationFee, program };

    let sda = "NOSDA";

    try {
        const { bTx, swapDataAccount } = await createMakeSwapInstructions({
            ...makeArgs,
            ...envOpts,
        });
        sda = swapDataAccount;
        const hash = await sendSingleTransaction({
            tx: { tx: bTx.tx, signers: [maker] },
            ...optionSend,
        });

        return {
            hash,
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
