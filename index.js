import {createInitializeSwapInstructions} from "./src/programInstructions/initializeSwap.instructions";
import {initializeSwap} from "./src/processor/initializeSwap";
import {getProgram} from "./src/utils/getProgram.obj";
import {getSwapDataAccountFromPublicKey} from "./src/utils/getSwapDataAccountFromPublicKey.function";
import {getSwapIdentityFromData} from "./src/utils/getSwapIdentityFromData.function";
import {sendBundledTransactions} from "./src/utils/sendBundledTransactions.function";

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
