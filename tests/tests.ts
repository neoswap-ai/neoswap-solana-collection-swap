import { Connection } from "@solana/web3.js";
import { NETWORK_URL } from "./consts";
import { testMakeSwap } from "./makeSwap";
import { EnvOpts } from "../src/utils/types";

let clusterOrUrl = NETWORK_URL;
let connection = new Connection(clusterOrUrl);
let envOpts = { clusterOrUrl, prioritizationFee: undefined } as EnvOpts;

testMakeSwap(envOpts, connection);
