import { cancelSwap } from "./processor/cancelSwap";
// import { claimSwap } from "./processor/claimSwap";
import { makeSwap } from "./processor/makeSwap";
// import { payRoyalties } from "./processor/payRoyalties";
import { takeAndCloseSwap } from "./processor/takeAndCloseSwap";
// import { takeSwap } from "./processor/takeSwap";
import { createCancelSwapInstructions } from "./programInstructions/cancelSwap.instructions";
// import { createClaimSwapInstructions } from "./programInstructions/claimSwap.instructions";
import { createMakeSwapInstructions } from "./programInstructions/makeSwap.instructions";
import { createMakeTraitSwapInstructions } from "./programInstructions/makeTraitSwap.instructions";
import { createAddBidBt, createRmBidBt } from "./programInstructions/modifyAddBid.instructions";
// import { createPayRoyaltiesInstructions } from "./programInstructions/payRoyalties.instructions";
import { createSetNewTime } from "./programInstructions/setNewTime.instructions";
import { createTakeAndCloseSwapInstructions } from "./programInstructions/takeAndCloseSwap.instructions";
import { createLookUpTableAccount } from "./utils/addressLookupTable";
// import { createTakeSwapInstructions } from "./programInstructions/takeSwap.instructions";
import {
  checkEnvOpts,
  checkOptionSend,
  isClaimSArg,
  isMakeSArg,
  isRmBidsArgs,
  isTakeSArg,
  isUpdateSArg,
  whatIs,
} from "./utils/check";
import {
  getTraitRoot,
  getCompNFTData,
  getRoot,
  makeRoot,
  recalculateRoot,
  hashTwo,
} from "./utils/compressedHelper";
import { getCreatorData } from "./utils/creators";
import { DESC } from "./utils/descriptions";
import { calculateMakerFee } from "./utils/fees";
import {
  findNftDataAndMetadataAccount,
  findNftMasterEdition,
  findRuleSet,
  findUserTokenRecord,
  standardToProgram,
  whichStandard,
} from "./utils/findNftDataAndAccounts.function";
import { findOrCreateAta } from "./utils/findOrCreateAta.function";
import { getSda } from "./utils/getPda";
import { getProgram } from "./utils/getProgram.obj";
import { getBidAccountData, getOpenSda, getSdaData } from "./utils/getSdaData.function";
import { getIdlForBlock } from "./utils/idl/idlGetter";
import { isConfirmedTx } from "./utils/isConfirmedTx.function";
import { closeBidAccountInstructions, createBidAccountInstructions } from "./utils/makeSwap.utils";
import {
  sendBundledTransactions,
  sendBundledTransactionsV2,
  sendBundledTransactionsV3,
} from "./utils/sendBundledTransactions.function";
import { sendSingleBundleTransaction } from "./utils/sendSingleTransaction.function";
import { bidToscBid } from "./utils/typeSwap";
import { addWSol, closeWSol } from "./utils/wsol";
// import { closeUserPda } from "./utils/userPdaClose";
export * from "./utils/types";
export * from "./utils/const";

export * as neoColTypes from "./utils/types";
export * as neoColConst from "./utils/const";

export const NFT_ACCOUNTS = {
  findNftDataAndMetadataAccount,
  findNftMasterEdition,
  findRuleSet,
  findUserTokenRecord,
  whichStandard,
  standardToProgram,
  getCreatorData,
  addWSol,
  closeWSol,
};
export const TYPES = {
  whatIs,
  isUpdateSArg,
  isClaimSArg,
  isTakeSArg,
  isMakeSArg,
  isRmBidsArgs,
  bidToscBid,
  checkEnvOpts,
  checkOptionSend,
};

export const COMP = {
  makeRoot,
  recalculateRoot,
  getCompNFTData,
  getRoot,
  getTraitRoot,
  hashTwo,
};

export const UTILS = {
  NFT_ACCOUNTS,
  TYPES,
  COMP,
  getProgram,
  getSdaData,
  getOpenSda,
  sendBundledTransactions,
  sendBundledTransactionsV2,
  sendBundledTransactionsV3,
  sendSingleBundleTransaction,
  isConfirmedTx,
  findOrCreateAta,
  addWSol,
  closeWSol,
  bidToscBid,
  checkEnvOpts,
  checkOptionSend,
  getSda,
  getCreatorData,
  calculateMakerFee,
  makeRoot,
  recalculateRoot,
  createLookUpTableAccount,
  getCompNFTData,
  getRoot,
  getIdlForBlock,
  getBidAccountData,
  DESC,
  // closeUserPda,
};
export const CREATE_INSTRUCTIONS = {
  createMakeSwapInstructions,
  createMakeTraitSwapInstructions,
  // createTakeSwapInstructions,
  // createPayRoyaltiesInstructions,
  // createClaimSwapInstructions,
  createTakeAndCloseSwapInstructions,
  createCancelSwapInstructions,
  createAddBidBt,
  createRmBidBt,
  createSetNewTime,
  createBidAccountInstructions,
  closeBidAccountInstructions,
};

export const neoColSwap = {
  makeSwap,
  // takeSwap,
  takeAndCloseSwap,
  // payRoyalties,
  // claimSwap,
  cancelSwap,
  UTILS,
  CREATE_INSTRUCTIONS,
  NFT_ACCOUNTS,
  TYPES,
};
