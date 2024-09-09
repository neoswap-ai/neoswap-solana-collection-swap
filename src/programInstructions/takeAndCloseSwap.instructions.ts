import { getSdaData } from "../utils/getSdaData.function";
import { TransactionInstruction } from "@solana/web3.js";
import { BundleTransaction, EnvOpts, TakeSArg } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { NS_FEE, VERSION } from "../utils/const";
import {
  findNftDataAndMetadataAccount,
  whichStandard,
} from "../utils/findNftDataAndAccounts.function";
import { checkEnvOpts, getTakeArgs } from "../utils/check";
import { takerFee } from "../utils/fees";
import {
  createClaimSwapIxs,
  createCloseSwapIxs,
  createPayRoyaltiesIxs,
  createTakeSwapIxs,
  parseTakeAndCloseTxs,
} from "../utils/takeSwap.utils";
import { createTakeBatchTransactions } from "../utils/makeSwap.utils";
import { appendBtByChunk } from "../utils/vtx";

export async function createTakeAndCloseSwapInstructions(
  Data: TakeSArg & EnvOpts // & { index: number }
): Promise<BundleTransaction[]> {
  console.log(VERSION);
  let cEnvOpts = await checkEnvOpts(Data);
  let takeArgs = getTakeArgs(Data);
  let { program, connection } = cEnvOpts;
  let {
    taker,
    swapDataAccount,
    bid,
    nftMintTaker,
    verifyTaker,
    signer,
    n,
    unwrap,
    traitIndex,
    traitProofs,
  } = takeArgs;
  if (!n) n = 0;

  if (!signer) {
    console.log("no signer", taker);
    signer = taker;
  } else console.log("signer", signer, "taker", taker);

  let takeIxs: TransactionInstruction[] = [];
  let claimIxs: TransactionInstruction[] = [];
  let payRMakerIxs: TransactionInstruction[] = [];
  let payRTakerIxs: TransactionInstruction[] = [];
  try {
    let swapDataData = await getSdaData({
      program,
      swapDataAccount,
    });

    const {
      paymentMint: paymentMint,
      maker,
      nftMintMaker,
      bids,
      acceptedBid,
      royaltiesPaidMaker,
      royaltiesPaidTaker,
      claimed,
    } = swapDataData;

    // prettier-ignore
    if (verifyTaker && swapDataData.taker && swapDataData.taker !== taker)
      throw "signer is not the taker of this swap";

    // checking the bid we want exists in SDA
    const foundBid = bids.find(
      (b) =>
        (b.amount === bid.amount &&
          b.collection === bid.collection &&
          b.makerRoyalties === bid.makerRoyalties &&
          b.makerNeoswapFee === bid.makerNeoswapFee &&
          b.takerNeoswapFee === bid.takerNeoswapFee &&
          b.takerRoyalties === bid.takerRoyalties) ||
        (n === 42 &&
          b.amount === bid.amount &&
          b.collection === bid.collection &&
          b.makerRoyalties === bid.makerRoyalties &&
          b.makerNeoswapFee === bid.makerNeoswapFee)
    );
    if (!foundBid) throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(bids)} `;

    // finding which standard the nfts are
    let makerNftStd = await whichStandard({ connection, mint: nftMintMaker });
    let takerNftStd = await whichStandard({ connection, mint: nftMintTaker });
    let bidAccount;
    // prettier-ignore
    if (
      traitIndex !== undefined &&
      traitProofs !== undefined &&
      traitProofs.length > 0
    ) {
      bidAccount = foundBid.collection;
    }

    //
    // finding payment ATAs
    //

    let { mintAta: takerTokenAta, instruction: takerTokenIx } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: taker,
      signer,
    });
    if (takerTokenIx) {
      if (!acceptedBid) {
        takeIxs.push(takerTokenIx);
      } else {
        claimIxs.push(takerTokenIx);
      }
    } else console.log("skip initialization of takerTokenAta", takerTokenAta);

    let { mintAta: swapDataAccountTokenAta, instruction: sdaTokenIx } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: swapDataAccount,
      signer,
    });

    let { mintAta: makerTokenAta, instruction: makerTokenIx } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: maker,
      signer,
    });
    if (makerTokenIx) {
      if (!acceptedBid) {
        takeIxs.push(makerTokenIx);
      } else {
        claimIxs.push(makerTokenIx);
      }
    } else console.log("skip initialization of makerTokenAta", makerTokenAta);

    let { mintAta: nsFeeTokenAta, instruction: nsTokenIx } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: NS_FEE,
      signer,
    });
    if (nsTokenIx) claimIxs.push(nsTokenIx);
    else console.log("skip initialization of nsFeeTokenAta", nsFeeTokenAta);

    // Getting metadata Maker Nft
    let nftMetadataMaker: string | undefined;
    let tokenStandardMaker: number | undefined;

    if (makerNftStd === "native") {
      console.log("makerNftStd", makerNftStd);
      ({ metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
        await findNftDataAndMetadataAccount({
          connection,
          mint: nftMintMaker,
        }));
    }

    // Getting metadata Taker Nft
    let nftMetadataTaker: string | undefined;
    let tokenStandardTaker: number | undefined;

    if (takerNftStd === "native") {
      console.log("takerNftStd", takerNftStd);
      ({ metadataAddress: nftMetadataTaker, tokenStandard: tokenStandardTaker } =
        await findNftDataAndMetadataAccount({
          connection,
          mint: nftMintTaker,
        }));
    }

    // taking Swap
    let takerAmount = takerFee({ bid, n });
    if (!acceptedBid) {
      await createTakeSwapIxs({
        bid,
        cEnvOpts,
        connection,
        maker,
        makerTokenAta,
        n,
        nftMintTaker,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        swapDataData,
        taker,
        takerAmount,
        takerNftStd,
        takerTokenAta,
        tokenStandardTaker,
        bidAccount,
        nftMetadataTaker,
        traitIndex,
        traitProofs,
      }).then((takeData) => {
        takeIxs.push(...takeData.takeIxs);
        if (takeData.nftMetadataTaker) nftMetadataTaker = takeData.nftMetadataTaker;
      });
    }

    // claimimg Swap
    if (!claimed) {
      await createClaimSwapIxs({
        cEnvOpts,
        connection,
        maker,
        makerNftStd,
        makerTokenAta,
        nftMintMaker,
        nsFeeTokenAta,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        taker,
        takerTokenAta,
        tokenStandardMaker,
        nftMetadataMaker,
      }).then((claimData) => {
        console.log("claimData", claimData);

        claimIxs.push(...claimData.claimIxs);
        if (claimData.nftMetadataMaker) nftMetadataMaker = claimData.nftMetadataMaker;
      });
    }

    // Paying royalties Taker
    if (!royaltiesPaidTaker) {
      console.log("royaltiesPaidTaker", makerNftStd);
      await createPayRoyaltiesIxs({
        cEnvOpts,
        connection,
        nftCurrentOwner: swapDataAccount,
        nftMint: nftMintMaker,
        payer: taker,
        paymentMint,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        tokenStandard: makerNftStd,
        nftMetadata: nftMetadataMaker,
      }).then((payRoyaltiesData) => {
        payRTakerIxs.push(...payRoyaltiesData.payRTakerIxs);
        if (payRoyaltiesData.nftMetadata) nftMetadataMaker = payRoyaltiesData.nftMetadata;
      });
    }

    // Paying royalties maker
    if (!royaltiesPaidMaker) {
      console.log("royaltiesPaidMaker", takerNftStd);
      await createPayRoyaltiesIxs({
        cEnvOpts,
        connection,
        nftCurrentOwner: taker,
        nftMint: nftMintTaker,
        payer: maker,
        paymentMint,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        tokenStandard: takerNftStd,
        nftMetadata: nftMetadataTaker,
      }).then((payRoyaltiesData) => {
        payRMakerIxs.push(...payRoyaltiesData.payRTakerIxs);
        if (payRoyaltiesData.nftMetadata) nftMetadataTaker = payRoyaltiesData.nftMetadata;
      });
    }

    // Closing
    let { addToClaimIxs, closeSIxs } = await createCloseSwapIxs({
      cEnvOpts,
      maker,
      makerTokenAta,
      signer,
      swapDataAccount,
      swapDataAccountTokenAta,
      swapDataData,
      taker,
      takerTokenAta,
      unwrap,
    });
    if (addToClaimIxs.length > 1) claimIxs.push(...addToClaimIxs);

    let BTs = await appendBtByChunk(
      createTakeBatchTransactions({
        takeIxs,
        claimIxs,
        payRMakerIxs,
        payRTakerIxs,
        closeSIxs,
        Data,
      }),
      cEnvOpts,
      signer
    );
    return BTs;
  } catch (error: any) {
    console.log("error init", error);

    throw {
      blockchain: "solana",
      status: "error",
      message: error,
      swapDataAccount,
    };
  }
}
