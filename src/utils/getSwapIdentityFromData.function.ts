import { PublicKey } from "@solana/web3.js";
import { utils } from "@project-serum/anchor";
import { SWAP_PROGRAM_ID } from "./const";
import { ErrorFeedback, SwapData, SwapIdentity } from "./types";

export function getSwapIdentityFromData(Data: { swapData: SwapData }): SwapIdentity {
    // console.log("swapdata", Data.swapData);
    try {
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
            // preSeed: Data.swapData.preSeed,
            swapData: Data.swapData,
        };
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            order: 0,
            message: error,
        } as ErrorFeedback;

        // [
        //     { blockchain: "solana", order: 0, type: "error", description: error },
        // ] as ErrorFeedback;
    }
}
