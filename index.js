const createInitializeSwapInstructions = require("./src/programInstructions/createInitializeSwapInstructions");
const initializeSwap = require("./src/processor/initializeSwap");
const getProgram = require("./src/utils/getProgram.obj");
const getSwapDataAccountFromPublicKey = require("./src/utils/getSwapDataAccountFromPublicKey.function");
const getSwapDataAccountFromData = require("./src/utils/getSwapDataAccountFromData.function");
const sendBundledTransactions = require("./src/utils/sendBundledTransactions.function");

let utils = {
    getProgram,
    getSwapDataAccountFromPublicKey,
    getSwapDataAccountFromData,
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
