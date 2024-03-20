import { createMakeSwapInstructions } from "../src/programInstructions/makeSwap.instructions";
import { EnvOpts, MakeSArg } from "../src/utils/types";

let makeSwapData = { bid, endDate, maker, nftMintMaker, paymentMint } as MakeSArg;
let envOpts = { clusterOrUrl, prioritizationFee, program } as EnvOpts;
let tt = createMakeSwapInstructions({ ...makeSwapData, ...envOpts });
