import { Cluster, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Bid, ErrorFeedback, OptionSend, TakeSArg } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";
import { checkOptionSend } from "../utils/check";

export async function takeSwap(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): Promise<string> {
    let {
        bid,
        nftMintTaker,
        swapDataAccount,
        taker,
        prioritizationFee,
    } = Data;

    let optionSend = checkOptionSend(Data);
    let clusterOrUrl = optionSend.clusterOrUrl;
    const program = getProgram({ clusterOrUrl, signer: taker });

    try {
        return await sendSingleTransaction({
            ...optionSend,
            tx: {
                tx: (
                    await createTakeSwapInstructions({
                        program,
                        taker: taker.publicKey.toString(),
                        bid,
                        swapDataAccount,
                        nftMintTaker,
                        prioritizationFee,
                    })
                ).tx,
                signers: [taker],
            },
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
