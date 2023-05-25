export { getProgram } from "./utils/getProgram.obj";
export { sendBundledTransactions } from "./utils/sendBundledTransactions.function";
import { initializeSwap } from "./processor/initializeSwap";
import { createInitializeSwapInstructions } from "./programInstructions/initializeSwap.instructions";
import { getProgram } from "./utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "./utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "./utils/getSwapIdentityFromData.function";
import { sendBundledTransactions } from "./utils/sendBundledTransactions.function";

const utils = {
    getProgram,
    getSwapDataAccountFromPublicKey,
    getSwapIdentityFromData,
    sendBundledTransactions,
};
const createInstructions = {
    createInitializeSwapInstructions,
};
export const neoSwapNpm = {
    initializeSwap,
    utils,
    createInstructions,
};
