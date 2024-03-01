import { PublicKey, Signer, Transaction } from "@solana/web3.js";
import BN from "bn.js";

export type Bid = {
    collection: string;
    amount: number;
    makerNeoswapFee: number;
    takerNeoswapFee: number;
    takerRoyalties: number;
    makerRoyalties: number;
};
export type ScBid = {
    collection: PublicKey;
    amount: BN;
    makerNeoswapFee: BN;
    takerNeoswapFee: BN;
    takerRoyalties: BN;
    makerRoyalties: BN;
};

export type SwapData = {
    maker: string;
    nftMintMaker: string;

    bids: Bid[];

    taker?: string;
    nftMintTaker?: string;
    acceptedBid?: Bid;

    endTime: number;

    royaltiesPaid: boolean;

    paymentMint: string;
    seed: string;
};

export type ScSwapData = {
    maker: PublicKey;
    nftMintMaker: PublicKey;

    bids: ScBid[];

    taker?: PublicKey;
    nftMintTaker?: PublicKey;
    acceptedBid?: ScBid;

    endTime: BN;

    royaltiesPaid: boolean;

    paymentMint: PublicKey;
    seed: string;
};
//
//
//
//
//
//

export type UnwrapSol = {
    type: "unwrap-sol";
    ordinalsSc: string;
    user: string;
    userAta: string;
};

// change to throw error
export type ErrorFeedback = {
    blockchain: "solana";
    status: "error";
    message: string | any;
    swapStatus?: number;
};

export type TxWithSigner = { tx: Transaction; signers?: Signer[] };

export type InitializeData = {
    swapDataAccount: string;
    tx: Transaction;
};
