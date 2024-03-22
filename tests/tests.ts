import { Connection } from "@solana/web3.js";
import { NETWORK_URL } from "./consts";
import { testMakeSwap } from "./makeSwap";
import { EnvOpts } from "../src/utils/types";

let clusterOrUrl = NETWORK_URL;
let connection = new Connection(clusterOrUrl);
let envOpts = { clusterOrUrl, prioritizationFee: 1 } as EnvOpts;
let final: string[] = [];

async function test() {
    await testMakeSwap(envOpts, connection).then((res) => {
        final.push(res);
    });

    console.log("final", final);
}

test();
