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
import { isError, isErrorInit } from "./utils/isError.function";
import { sendBundledTransactions } from "./utils/sendBundledTransactions.function";
import {
    ApiProcessorData,
    ErrorFeedback,
    ItemStatus,
    NftSwapItem,
    SwapData,
    SwapIdentity,
    TradeStatus,
    TxWithSigner,
} from "./utils/types";

const utils = {
    getProgram,
    getSwapDataAccountFromPublicKey,
    getSwapIdentityFromData,
    sendBundledTransactions,
    isError,
    isErrorInit,
};
const createInstructions = {
    createInitializeSwapInstructions,
    createDepositSwapInstructions,
    createClaimSwapInstructions,
    createCancelSwapInstructions,
    prepareDepositSwapInstructions,
};

const types = {
    // NftSwapItem,
    // SwapData,
    // SwapIdentity,
    // ApiProcessorData,
    // ErrorFeedback,
    // TxWithSigner,
};

const neoSwapNpm = {
    initializeSwap,
    depositSwap,
    claimAndCloseSwap,
    cancelAndCloseSwap,
    utils,
    createInstructions,
    types,
};
export default neoSwapNpm;
