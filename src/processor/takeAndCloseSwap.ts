import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, CEnvOpts, EnvOpts, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";

import { createTakeAndCloseSwapInstructions } from "../programInstructions/takeAndCloseSwap.instructions";
import { checkOptionSend, getTakeArgs } from "../utils/check";

export async function takeAndCloseSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<string[]> {
    let takeArgs = getTakeArgs(Data);
    let optionSend = checkOptionSend(Data);

    let { clusterOrUrl } = optionSend;
    const program = getProgram({ clusterOrUrl, signer: Data.taker });

    try {
        return await sendBundledTransactions({
            txsWithoutSigners: await createTakeAndCloseSwapInstructions({
                ...takeArgs,
                clusterOrUrl,
                program,
            }),
            signer: Data.taker,
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
