import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, MakeSArg, OptionSend } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createMakeSwapInstructions } from "../programInstructions/makeSwap.instructions";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { checkOptionSend, checkEnvOpts, getMakeArgs } from "../utils/check";

export async function makeSwap(
    Data: OptionSend &
        Omit<MakeSArg, "maker"> & {
            maker: Keypair;
        }
): Promise<{ hash: string; swapDataAccount: string }> {
    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);
    let makeArgs = getMakeArgs(Data);
    let swapDataAccount = "unknown swapDataAccount";

    try {
        const { bTx, swapDataAccount: sda } = await createMakeSwapInstructions({
            ...makeArgs,
            ...cEnvOpts,
        });
        swapDataAccount = sda;
        const hash = await sendSingleTransaction({
            tx: bTx.tx,
            signer: Data.maker,
            ...cOptionSend,
        });

        return {
            hash,
            swapDataAccount: swapDataAccount,
        };
    } catch (error) {
        throw {
            blockchain: "solana",
            message: swapDataAccount + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
