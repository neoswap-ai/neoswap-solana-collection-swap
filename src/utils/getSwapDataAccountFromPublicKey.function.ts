import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SwapData } from "./types";

export async function getSwapDataAccountFromPublicKey(
    program: Program,
    swapDataAccount_publicKey: PublicKey
): Promise<SwapData | undefined> {
    try {
        // console.log(swapDataAccount_publicKey.toBase58());

        const swapData = (await program.account.swapData.fetch(
            swapDataAccount_publicKey
        )) as SwapData;
        // console.log("swapData", swapData);

        if (!swapData) {
            return undefined;
        } else {
            return swapData;
        }
    } catch (error) {
        console.log("error", error);

        return undefined;
    }
}
