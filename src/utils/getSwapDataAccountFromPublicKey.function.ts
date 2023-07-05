import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ErrorFeedback, SwapData } from "./types";

export async function getSwapDataAccountFromPublicKey(Data: {
    program: Program;
    swapDataAccount_publicKey: PublicKey;
}): Promise<SwapData | undefined> {
    try {
        const swapData = (await Data.program.account.swapData.fetch(
            Data.swapDataAccount_publicKey
        )) as SwapData;

        if (!swapData) {
            throw `No SwapData found ${Data.swapDataAccount_publicKey.toBase58()}`;
        } else {
            return swapData;
        }
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}
