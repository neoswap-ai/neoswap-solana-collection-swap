import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SwapData } from "./types";

export async function getSwapDataAccountFromPublicKey(Data: {
    program: Program;
    swapDataAccount_publicKey: PublicKey;
}): Promise<SwapData | undefined> {
    // try {
    // console.log(Data.swapDataAccount_publicKey.toBase58());

    const swapData = (await Data.program.account.swapData.fetch(
        Data.swapDataAccount_publicKey
    )) as SwapData;
    // console.log("swapData", swapData);

    if (!swapData) {
        throw `No SwapData found ${Data.swapDataAccount_publicKey.toBase58()}`;
    } else {
        return swapData;
    }
    // } catch (error) {
    //     console.log("error", error);

    //     return err;
    // }
}
