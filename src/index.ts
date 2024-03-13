import { cancelSwap } from "./processor/cancelSwap";
import { claimSwap } from "./processor/claimSwap";
import { makeSwap } from "./processor/makeSwap";
import { payRoyalties } from "./processor/payRoyalties";
import { takeAndCloseSwap } from "./processor/takeAndCloseSwap";
import { takeSwap } from "./processor/takeSwap";
import { createCancelSwapInstructions } from "./programInstructions/cancelSwap.instructions";
import { createClaimSwapInstructions } from "./programInstructions/claimSwap.instructions";
import { createMakeSwapInstructions } from "./programInstructions/makeSwap.instructions";
import { createPayRoyaltiesInstructions } from "./programInstructions/payRoyalties.instructions";
import { createTakeAndCloseSwapInstructions } from "./programInstructions/takeAndCloseSwap.instructions";
import { createTakeSwapInstructions } from "./programInstructions/takeSwap.instructions";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "./utils/findNftDataAndAccounts.function";
import { findOrCreateAta } from "./utils/findOrCreateAta.function";
import { getCNFTData, getCNFTOwner } from "./utils/getCNFTData.function";
import { getProgram } from "./utils/getProgram.obj";
import { getOpenSda, getSdaData } from "./utils/getSdaData.function";
import { isConfirmedTx } from "./utils/isConfirmedTx.function";
import { sendBundledTransactions } from "./utils/sendBundledTransactions.function";
// import { closeUserPda } from "./utils/userPdaClose";
export * as neoTypes from "./utils/types";
export * as neoConst from "./utils/const";

const NFT_ACCOUNTS = {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
    getCNFTData,
    getCNFTOwner,
};

const UTILS = {
    NFT_ACCOUNTS,
    getProgram,
    getSdaData,
    getOpenSda,
    sendBundledTransactions,
    isConfirmedTx,
    findOrCreateAta,
    // closeUserPda,
};
const CREATE_INSTRUCTIONS = {
    createMakeSwapInstructions,
    createTakeSwapInstructions,
    createPayRoyaltiesInstructions,
    createClaimSwapInstructions,
    createTakeAndCloseSwapInstructions,
    createCancelSwapInstructions,
};

export const neoSwap = {
    makeSwap,
    takeSwap,
    takeAndCloseSwap,
    payRoyalties,
    claimSwap,
    cancelSwap,
    UTILS,
    CREATE_INSTRUCTIONS,
};
