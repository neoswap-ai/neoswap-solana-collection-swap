import { Program } from "@coral-xyz/anchor";
import {
    Cluster,
    Keypair,
    PublicKey,
    Signer,
    Transaction,
    VersionedTransaction,
} from "@solana/web3.js";
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
    status: "active" | "expired" | "accepted";
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

export type TxWithSigner = { tx: VersionedTransaction; signers?: Signer[] };

export type InitializeData = {
    swapDataAccount: string;
    tx: VersionedTransaction;
};

export type BundleTxBase = {
    tx: VersionedTransaction; // [];
    stx?: VersionedTransaction; // [];
    blockheight?: number;
    description: string;
    priority: number;
    status: "pending" | "broadcast" | "success" | "failed";
    hash?: string;
    failedReason?: string;
    retries?: number;
};

export type BundleTransaction = BTMake | BTTake | BTClaim;

export type BTMake = BundleTxBase & { details: MakeSArg };
export type BTTake = BundleTxBase & { details: TakeSArg };
export type BTClaim = BundleTxBase & { details: ClaimArg };

export type MakeSArg = {
    maker: string;
    nftMintMaker: string;
    paymentMint: string;
    bid: Bid;
    endDate: number;
    fees?: number;
};
export type TakeSArg = {
    swapDataAccount: string;
    taker: string;
    nftMintTaker: string;
    bid: Bid;
    fees?: number;
};
export type ClaimArg = {
    swapDataAccount: string;
    signer: string;
    fees?: number;
};
export type OptionSend = {
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
};
export type EnvOpts = {
    clusterOrUrl?: Cluster | string;
    program?: Program;
};
export type MakeSwapData = { bTx: BundleTransaction; swapDataAccount: string };
export type TakeAndCloseSwapData = { bTxs: BundleTransaction[]; swapDataAccount: string };
