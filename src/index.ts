// export { getProgram } from "./utils/getProgram.obj";
// export { sendBundledTransactions } from "./utils/sendBundledTransactions.function";
import { createInitializeSwapInstructions } from "./programInstructions/initializeSwap.instructions";
import { initializeSwap } from "./processor/initializeSwap";
import { getProgram } from "./utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "./utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "./utils/getSwapIdentityFromData.function";
import { sendBundledTransactions } from "./utils/sendBundledTransactions.function";

let utils = {
    getProgram,
    getSwapDataAccountFromPublicKey,
    getSwapIdentityFromData,
    sendBundledTransactions,
};
let createInstructions = {
    createInitializeSwapInstructions,
};
export let neoSwapNpm = {
    initializeSwap,
    utils,
    createInstructions,
};
