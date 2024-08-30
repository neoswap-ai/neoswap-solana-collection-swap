import BN from "bn.js";
import {
  Bid,
  ScBid,
  ScSwapData,
  ScTraitBidAccount,
  SwapData,
  TraitBidAccount,
} from "./types";
import { PublicKey } from "@solana/web3.js";

export function bidToscBid(bid: Bid): ScBid {
  return {
    amount: new BN(bid.amount),
    collection: new PublicKey(bid.collection),
    makerNeoswapFee: new BN(bid.makerNeoswapFee),
    makerRoyalties: new BN(bid.makerRoyalties),
    takerNeoswapFee: new BN(bid.takerNeoswapFee),
    takerRoyalties: new BN(bid.takerRoyalties),
  } as ScBid;
}

export function scBidToBid(bid: ScBid): Bid {
  return {
    amount: bid.amount.toNumber(),
    collection: bid.collection.toString(),
    makerNeoswapFee: bid.makerNeoswapFee.toNumber(),
    makerRoyalties: bid.makerRoyalties.toNumber(),
    takerNeoswapFee: bid.takerNeoswapFee.toNumber(),
    takerRoyalties: bid.takerRoyalties.toNumber(),
  };
}
export function traitBidToScTraitBid(
  traitBid: TraitBidAccount
): ScTraitBidAccount {
  return {
    owner: new PublicKey(traitBid.owner),
    traitProofs: traitBid.traitProofs.map((proof) => new PublicKey(proof)),
  };
}

export function scTraitBidToTraitBid(
  scTraitBid: ScTraitBidAccount
): TraitBidAccount {
  return {
    owner: scTraitBid.owner.toString(),
    traitProofs: scTraitBid.traitProofs.map((proof) => proof.toString()),
  };
}

export function swapDataToScSwapData(sda: SwapData): ScSwapData {
  let {
    bids,
    endTime,
    maker,
    nftMintMaker,
    paymentMint,
    royaltiesPaidMaker,
    royaltiesPaidTaker,
    acceptedBid,
    nftMintTaker,
    refererMaker,
    refererTaker,
    taker,
    claimed,
  } = sda;
  console.log({
    bids,
    endTime,
    maker,
    nftMintMaker,
    paymentMint,
    royaltiesPaidMaker,
    royaltiesPaidTaker,
    acceptedBid,
    nftMintTaker,
    refererMaker,
    refererTaker,
    taker,
  });

  return {
    bids: bids.map(bidToscBid),
    endTime: new BN(endTime),
    maker: new PublicKey(maker),
    nftMintMaker: new PublicKey(nftMintMaker),
    paymentMint: new PublicKey(paymentMint),
    royaltiesPaidMaker,
    royaltiesPaidTaker,
    claimed,
    refererMaker: refererMaker ? new PublicKey(refererMaker) : undefined,
    refererTaker: refererTaker ? new PublicKey(refererTaker) : undefined,
    acceptedBid: acceptedBid ? bidToscBid(acceptedBid) : undefined,
    taker: taker ? new PublicKey(taker) : undefined,
    nftMintTaker: nftMintTaker ? new PublicKey(nftMintTaker) : undefined,
  };
}

export function scSwapDataToSwapData(scSwapData: ScSwapData): SwapData {
  let {
    bids,
    endTime,
    maker,
    nftMintMaker,
    paymentMint,
    royaltiesPaidMaker,
    royaltiesPaidTaker,
    acceptedBid,
    nftMintTaker,
    refererMaker,
    refererTaker,
    taker,
    claimed,
  } = scSwapData;
  let status: SwapData["status"] = "active";
  if (acceptedBid) status = "accepted";
  else if (endTime.lt(new BN(Date.now() / 1000)) && endTime.toNumber() != 0)
    status = "expired";
  return {
    bids: bids.map(scBidToBid),
    endTime: endTime.toNumber(),
    maker: maker.toString(),
    nftMintMaker: nftMintMaker.toString(),
    paymentMint: paymentMint.toString(),
    royaltiesPaidMaker,
    royaltiesPaidTaker,
    claimed,
    refererMaker: refererMaker ? refererMaker.toString() : undefined,
    refererTaker: refererTaker ? refererTaker.toString() : undefined,
    acceptedBid: acceptedBid ? scBidToBid(acceptedBid) : undefined,
    nftMintTaker: nftMintTaker ? nftMintTaker.toString() : undefined,
    taker: taker ? taker.toString() : undefined,
    status,
  };
}
