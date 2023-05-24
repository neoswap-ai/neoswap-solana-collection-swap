import { PublicKey } from "@solana/web3.js";
import { utils } from "@project-serum/anchor";
import { SWAP_PROGRAM_ID } from "./const";
import { SwapData, SwapIdentity } from "./types";

export async function getSwapIdentityFromData(Data: {
    swapData: SwapData;
    // preSeed: string;
}): Promise<SwapIdentity> {
    // console.log(preSeed);
    try {
        // if (!Data.preSeed) {
        //     Data.preSeed = Data.swapData.preSeed;
        // }
        let seed = Data.swapData.preSeed;

        Data.swapData.items
            .sort((x, y) => {
                return (
                    x.mint.toString() +
                    x.owner.toString() +
                    x.destinary.toString()
                ).localeCompare(y.mint.toString() + y.owner.toString() + y.destinary.toString());
            })
            .forEach((item) => {
                seed += item.mint;
                seed += item.owner;
                seed += item.destinary;
            });

        let swapDataAccount_seed = Buffer.from(utils.sha256.hash(seed)).subarray(0, 32);

        const [swapDataAccount_publicKey, swapDataAccount_bump] = PublicKey.findProgramAddressSync(
            [swapDataAccount_seed],
            SWAP_PROGRAM_ID
        );

        return {
            swapDataAccount_publicKey,
            swapDataAccount_seed,
            swapDataAccount_bump,
            swapData: Data.swapData,
        };
    } catch (error) {
        throw error;
    }
}
