const createInitializeSwapInstructions = require("./src/programInstructions/initializeSwap.instructions");
const initializeSwap = require("./src/processor/initializeSwap");
const getProgram = require("./src/utils/getProgram.obj");
const getSwapDataAccountFromPublicKey = require("./src/utils/getSwapDataAccountFromPublicKey.function");
const getSwapIdentityFromData = require("./src/utils/getSwapIdentityFromData.function");
const sendBundledTransactions = require("./src/utils/sendBundledTransactions.function");

let utils = {
    getProgram,
    getSwapDataAccountFromPublicKey,
    getSwapIdentityFromData,
    sendBundledTransactions,
};
let createInstructions = {
    createInitializeSwapInstructions,
};
let neoSwapNpm = {
    initializeSwap,
    utils,
    createInstructions,
};

module.exports = neoSwapNpm;
