import { apiProcessor } from "./processor/apiProcessor";
import { cancelAndCloseSwap } from "./processor/cancelAndCloseSwap";
import { claimAndCloseSwap } from "./processor/claimAndCloseSwap";
import { depositSwap } from "./processor/depositSwap";
import { initializeSwap } from "./processor/initializeSwap";
import { apiProcessorTranscript } from "./programInstructions/apiProcessor.transcript";
import { createCancelSwapInstructions } from "./programInstructions/cancelSwap.instructions";
import { createClaimSwapInstructions } from "./programInstructions/claimSwap.instructions";
import { createDepositSwapInstructions } from "./programInstructions/depositSwap.instructions";
import { prepareDepositSwapInstructions } from "./programInstructions/depositSwap.prepareInstructions";
import { createInitializeSwapInstructions } from "./programInstructions/initializeSwap.instructions";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "./utils/findNftDataAndAccounts.function";
import { findOrCreateAta } from "./utils/findOrCreateAta.function";
import { getCNFTData } from "./utils/getCNFTData.function";
import { getProgram } from "./utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "./utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "./utils/getSwapIdentityFromData.function";
import { isConfirmedTx } from "./utils/isConfirmedTx.function";
import { sendBundledTransactions } from "./utils/sendBundledTransactions.function";
import { swapDataConverter } from "./utils/swapDataConverter.function";
import { userSwapDetails } from "./utils/userSwapDetails.obj";
export * as neoTypes from "./utils/types";
export * as neoConst from "./utils/const";

const NFT_ACCOUNTS = {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
    getCNFTData,
};

const UTILS = {
    NFT_ACCOUNTS,
    getProgram,
    getSwapDataAccountFromPublicKey,
    getSwapIdentityFromData,
    userSwapDetails,
    sendBundledTransactions,
    isConfirmedTx,
    findOrCreateAta,
    swapDataConverter,
};
const CREATE_INSTRUCTIONS = {
    createInitializeSwapInstructions,
    createDepositSwapInstructions,
    createClaimSwapInstructions,
    createCancelSwapInstructions,
    prepareDepositSwapInstructions,
    apiProcessorTranscript,
};

export const neoSwap = {
    initializeSwap,
    depositSwap,
    claimAndCloseSwap,
    cancelAndCloseSwap,
    apiProcessor,
    UTILS,
    CREATE_INSTRUCTIONS,
};

// export default neoSwapNpm;
