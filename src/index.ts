import { cancelSwap } from "./processor/cancelSwap";
import { claimSwap } from "./processor/claimSwap";
import { makeSwap } from "./processor/makeSwap";
import { payRoyalties } from "./processor/payRoyalties";
import { takeAndCloseSwap } from "./processor/takeAndCloseSwap";
import { takeSwap } from "./processor/takeSwap";
import { createCancelSwapInstructions } from "./programInstructions/cancelSwap.instructions";
import { createClaimSwapInstructions } from "./programInstructions/claimSwap.instructions";
import { createMakeSwapInstructions } from "./programInstructions/makeSwap.instructions";
import { createAddBidIx, createRmBidIx } from "./programInstructions/modifyAddBid.instructions";
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
import { getProgram } from "./utils/getProgram.obj";
import { getOpenSda, getSdaData } from "./utils/getSdaData.function";
import { isConfirmedTx } from "./utils/isConfirmedTx.function";
import {
    sendBundledTransactions,
    sendBundledTransactionsV2,
} from "./utils/sendBundledTransactions.function";
import { sendSingleBundleTransaction } from "./utils/sendSingleTransaction.function";
import { bidToscBid } from "./utils/typeSwap";
import { addWSol, closeWSol } from "./utils/wsol";
// import { closeUserPda } from "./utils/userPdaClose";
export * as neoTypes from "./utils/types";
export * as neoConst from "./utils/const";

const NFT_ACCOUNTS = {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
};

const UTILS = {
    NFT_ACCOUNTS,
    getProgram,
    getSdaData,
    getOpenSda,
    sendBundledTransactions,
    sendBundledTransactionsV2,
    sendSingleBundleTransaction,
    isConfirmedTx,
    findOrCreateAta,
    addWSol,
    closeWSol,
    bidToscBid,
    // closeUserPda,
};
const CREATE_INSTRUCTIONS = {
    createMakeSwapInstructions,
    createTakeSwapInstructions,
    createPayRoyaltiesInstructions,
    createClaimSwapInstructions,
    createTakeAndCloseSwapInstructions,
    createCancelSwapInstructions,
    createAddBidIx,
    createRmBidIx,
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
