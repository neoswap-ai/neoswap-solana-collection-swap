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

export function swapDataToScSwapData(bid: SwapData): ScSwapData {
    return {
        bids: bid.bids.map(bidToscBid),
        endTime: new BN(bid.endTime),
        maker: new PublicKey(bid.maker),
        nftMintMaker: new PublicKey(bid.nftMintMaker),
        paymentMint: new PublicKey(bid.paymentMint),
        royaltiesPaid: bid.royaltiesPaid,
        seed: bid.seed,
        acceptedBid: bid.acceptedBid ? bidToscBid(bid.acceptedBid) : undefined,
        taker: bid.taker ? new PublicKey(bid.taker) : undefined,
        nftMintTaker: bid.nftMintTaker ? new PublicKey(bid.nftMintTaker) : undefined,
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
        royaltiesPaid: scSwapData.royaltiesPaid,
        seed: scSwapData.seed,
        acceptedBid: scSwapData.acceptedBid ? scBidToBid(scSwapData.acceptedBid) : undefined,
        nftMintTaker: scSwapData.nftMintTaker ? scSwapData.nftMintTaker.toString() : undefined,
        taker: scSwapData.taker ? scSwapData.taker.toString() : undefined,
        status,
    };
}
