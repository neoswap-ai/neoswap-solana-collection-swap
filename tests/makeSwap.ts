import { Connection } from "@solana/web3.js";
import { createMakeSwapInstructions } from "../src/programInstructions/makeSwap.instructions";
import { EnvOpts, MakeSArg } from "../src/utils/types";
import { now } from "@metaplex-foundation/js";
import { NATIVE_MINT } from "@solana/spl-token";
import { simulateTx } from "./utils";

let makeSwapArgs = {
    bids: [
        {
            amount: 1000,
            collection: "8ZtMj6bRTh7inEDVoha5Qb5Pfajqxm7nCbk6mD1HDEsS",
            makerNeoswapFee: 100,
            makerRoyalties: 200,
            takerNeoswapFee: 400,
            takerRoyalties: 500,
        },
    ],
    endDate: now().toNumber() + 86400,
    maker: "8zeXtUMZ5XsN8pWsBY95T1FiYm1mhqrf2F5ZkfB6Rjo9",
    nftMintMaker: "EffxAzJzojSt4JQiTqAwNZUrvwWjXs1HYZDxMqgNtxy2",
    paymentMint: NATIVE_MINT.toString(),
} as MakeSArg;

export async function testMakeSwap(envOpts: EnvOpts, connection: Connection) {
    let ReturnSwapData = await createMakeSwapInstructions({ ...makeSwapArgs, ...envOpts });
    try {
        await simulateTx(ReturnSwapData.bTxs[0].tx, connection);
        return "MakeSwap passed";
    } catch (error) {
        console.log("makeSwapArgs", makeSwapArgs);
        console.log("ReturnSwapData", ReturnSwapData);

        return "MakeSwap failed";
    }
}
