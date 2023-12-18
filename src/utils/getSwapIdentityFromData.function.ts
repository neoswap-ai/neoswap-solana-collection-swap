import { Cluster, PublicKey, SystemProgram } from "@solana/web3.js";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "./const";
import { ErrorFeedback, SwapData, SwapIdentity } from "./types";
import bs58 from "bs58";
import { hash } from "@project-serum/anchor/dist/cjs/utils/sha256";

export function getSwapIdentityFromData(Data: {
    swapData: SwapData;
    clusterOrUrl: Cluster | string;
}): SwapIdentity {
    // console.log("swapdata", Data.swapData);
    try {
        let seed = Data.swapData.preSeed;

        Data.swapData.nftItems
            .sort((x, y) => {
                return (
                    x.mint.toString() +
                    x.owner.toString() +
                    x.destinary.toString()
                ).localeCompare(y.mint.toString() + y.owner.toString() + y.destinary.toString());
            })

            .forEach((item) => {
                if (item.mint.equals(Data.swapData.acceptedPayement)) {
                    seed += item.collection;
                } else {
                    seed += item.mint;
                    seed += item.owner;
                }
            });

        let swapDataAccount_seed = Buffer.from(hash(seed)).subarray(0, 32);

        const [swapDataAccount_publicKey, swapDataAccount_bump] = PublicKey.findProgramAddressSync(
            [swapDataAccount_seed],
            Data.clusterOrUrl.includes("devnet") ? NEOSWAP_PROGRAM_ID_DEV : NEOSWAP_PROGRAM_ID
        );
        console.log("swapDataAccount_publicKey", swapDataAccount_publicKey.toBase58());
        // console.log("swapDataAccount_publicKey", Data.swapData);
        console.log(
            'Data.clusterOrUrl.includes("devnet") ? NEOSWAP_PROGRAM_ID_DEV : NEOSWAP_PROGRAM_ID',
            Data.clusterOrUrl.includes("devnet") ? NEOSWAP_PROGRAM_ID_DEV : NEOSWAP_PROGRAM_ID
        );

        // if (!Data.swapData.acceptedPayement)
        //     Data.swapData.items.map((item) => {
        //         if (!item.mint.equals(SystemProgram.programId) && !item.isNft)
        //             Data.swapData.acceptedPayement = item.mint;
        //     });

        Data.swapData.nbItems = {
            nft: Data.swapData.nftItems.length,
            tokens: Data.swapData.tokenItems.length,
        };
        Data.swapData.status = 0;
        return {
            swapDataAccount_publicKey,
            swapDataAccount_seed,
            swapDataAccount_bump,
            swapDataAccount_seedString: bs58.encode(swapDataAccount_seed),
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
