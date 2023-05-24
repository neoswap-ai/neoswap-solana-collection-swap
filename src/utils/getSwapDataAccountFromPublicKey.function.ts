import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SwapData } from "./types";

export async function getSwapDataAccountFromPublicKey(
    program: Program,
    swapDataAccount_publicKey: PublicKey
) {
    try {
        const swapData = (await program.account.swapData.fetch(
            swapDataAccount_publicKey
        )) as SwapData;
        if (!swapData) {
            return undefined;
        } else {
            return swapData;
        }
    } catch (error) {
        return undefined;
    }
}

