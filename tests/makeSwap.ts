import { Connection } from "@solana/web3.js";
import { createMakeSwapInstructions } from "../src/programInstructions/makeSwap.instructions";
import { EnvOpts, MakeSArg } from "../src/utils/types";
import { NETWORK_URL } from "./consts";
import { now } from "@metaplex-foundation/js";
import { NATIVE_MINT } from "@solana/spl-token";
import { simulateTx } from "./utils";

let makeSwapArgs = {
    bid: {
        amount: 1000,
        collection: "69k55dCTwiUPNgaTZ8FVMADorTvEGJEGuAGEB7m1qB1S",
        makerNeoswapFee: 100,
        makerRoyalties: 200,
        takerNeoswapFee: 400,
        takerRoyalties: 500,
    },
    endDate: now().toNumber() + 86400,
    maker: "CpB3k2pkmDK5uQVXH6YBKe8uQQsjBBaNwwnoauKkR6i4",
    nftMintMaker: "AjMgHhfhNNXTcsg8xBdVkx615FUo2ixM8Em5JWwcvyTM",
    paymentMint: NATIVE_MINT.toString(),
} as MakeSArg;

export async function testMakeSwap(envOpts: EnvOpts, connection: Connection) {
    try {
        let makeSwapData = await createMakeSwapInstructions({ ...makeSwapArgs, ...envOpts });
        await simulateTx(makeSwapData.bTx.tx, connection, makeSwapArgs, makeSwapData);
    } catch (error) {
        console.log("Error", error);
        throw "MakeSwap Test failed";
    }
}
