import BN from "bn.js";
import { Bid, ScBid, ScSwapData, SwapData } from "./types";
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

export function swapDataToScSwapData(sda: SwapData): ScSwapData {
    return {
        bids: sda.bids.map(bidToscBid),
        endTime: new BN(sda.endTime),
        maker: new PublicKey(sda.maker),
        nftMintMaker: new PublicKey(sda.nftMintMaker),
        paymentMint: new PublicKey(sda.paymentMint),
        royaltiesPaidMaker: sda.royaltiesPaidMaker,
        royaltiesPaidTaker: sda.royaltiesPaidTaker,
        seed: sda.seed,
        refererMaker: sda.refererMaker ? new PublicKey(sda.refererMaker) : undefined,
        refererTaker: sda.refererTaker ? new PublicKey(sda.refererTaker) : undefined,
        acceptedBid: sda.acceptedBid ? bidToscBid(sda.acceptedBid) : undefined,
        taker: sda.taker ? new PublicKey(sda.taker) : undefined,
        nftMintTaker: sda.nftMintTaker ? new PublicKey(sda.nftMintTaker) : undefined,
    };
}

export function scSwapDataToSwapData(scSwapData: ScSwapData): SwapData {
    let status: SwapData["status"] = "active";
    if (scSwapData.acceptedBid) status = "accepted";
    else if (scSwapData.endTime.lt(new BN(Date.now() / 1000)) && scSwapData.endTime.toNumber() != 0)
        status = "expired";
    return {
        bids: scSwapData.bids.map(scBidToBid),
        endTime: scSwapData.endTime.toNumber(),
        maker: scSwapData.maker.toString(),
        nftMintMaker: scSwapData.nftMintMaker.toString(),
        paymentMint: scSwapData.paymentMint.toString(),
        royaltiesPaidMaker: scSwapData.royaltiesPaidMaker,
        royaltiesPaidTaker: scSwapData.royaltiesPaidTaker,
        seed: scSwapData.seed,
        refererMaker: scSwapData.refererMaker ? scSwapData.refererMaker.toString() : undefined,
        refererTaker: scSwapData.refererTaker ? scSwapData.refererTaker.toString() : undefined,
        acceptedBid: scSwapData.acceptedBid ? scBidToBid(scSwapData.acceptedBid) : undefined,
        nftMintTaker: scSwapData.nftMintTaker ? scSwapData.nftMintTaker.toString() : undefined,
        taker: scSwapData.taker ? scSwapData.taker.toString() : undefined,
        status,
    };
}
