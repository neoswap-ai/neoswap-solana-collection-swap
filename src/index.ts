export { getProgram } from "./utils/getProgram.obj";
export { sendBundledTransactions } from "./utils/sendBundledTransactions.function";
import { cancelAndCloseSwap } from "./processor/cancelAndCloseSwap";
import { claimAndCloseSwap } from "./processor/claimAndCloseSwap";
import { depositSwap } from "./processor/depositSwap";
import { initializeSwap } from "./processor/initializeSwap";
import { createCancelSwapInstructions } from "./programInstructions/cancelSwap.instructions";
import { createClaimSwapInstructions } from "./programInstructions/claimSwap.instructions";
import { createDepositSwapInstructions } from "./programInstructions/depositSwap.instructions";
import { prepareDepositSwapInstructions } from "./programInstructions/depositSwap.prepareInstructions";
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
    createDepositSwapInstructions,
    createClaimSwapInstructions,
    createCancelSwapInstructions,
    prepareDepositSwapInstructions,
};
export const neoSwapNpm = {
    initializeSwap,
    depositSwap,
    claimAndCloseSwap,
    cancelAndCloseSwap,
    utils,
    createInstructions,
};
