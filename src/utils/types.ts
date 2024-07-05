import { Idl, Program } from "@coral-xyz/anchor";
import {
    Cluster,
    Connection,
    Finality,
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

    refererMaker?: string;
    refererTaker?: string;

    endTime: number;

    royaltiesPaidMaker: boolean;
    royaltiesPaidTaker: boolean;
    claimed: boolean;

    status: "active" | "expired" | "accepted";
    paymentMint: string;
};

export type ScSwapData = {
    maker: PublicKey;
    nftMintMaker: PublicKey;

    bids: ScBid[];

    taker?: PublicKey;
    nftMintTaker?: PublicKey;
    acceptedBid?: ScBid;

    refererMaker?: PublicKey;
    refererTaker?: PublicKey;

    endTime: BN;

    royaltiesPaidMaker: boolean;
    royaltiesPaidTaker: boolean;
    claimed: boolean;

    paymentMint: PublicKey;
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

export type vT = {
    tx: VersionedTransaction; // [];
    stx?: VersionedTransaction;
};
export type T = {
    tx: Transaction; // [];
    stx?: Transaction;
};
export type BundleTxBase = {
    blockheight?: number;
    description: string;
    priority: number;
    status: "pending" | "broadcast" | "success" | "failed" | "Timeout";
    hash?: string;
    failedReason?: string;
    retries?: number;
};
export type Act = MakeSArg | TakeSArg | ClaimSArg | UpdateSArgs | RmBidArgs | SetNewTime;

export type BTAct = BundleTxBase & { details: Act | any };

export type BTv = BTAct & vT;
export type BTt = BTAct & T;

export type BundleTransaction = BTv | BTt;

export type MakeSArg = {
    maker: string;
    nftMintMaker: string;
    paymentMint: string;
    bids: Bid[];
    endDate: number;
};
export type TakeSArg = {
    swapDataAccount: string;
    taker: string;
    signer?: string;
    nftMintTaker: string;
    bid: Bid;
    verifyTaker?: boolean;
};
export type ClaimSArg = {
    swapDataAccount: string;
    signer: string;
};
export type UpdateSArgs = {
    bids: Bid[];
    swapDataAccount: string;
    maker: string;

    makerTokenAta?: string;
    swapDataAccountTokenAta?: string;
    paymentMint?: string;
};
export type RmBidArgs = {
    rmBids: Bid[];
    swapDataAccount: string;
    maker: string;

    makerTokenAta?: string;
    swapDataAccountTokenAta?: string;
    paymentMint?: string;
};
export type SetNewTime = {
    swapDataAccount: string;
    newTime: number;
    maker: string;
};

export type OptionSend = {
    clusterOrUrl?: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
    commitment?: Finality;
    connection?: Connection;
    retryDelay?: number;
    prioritizationFee?: number;
};
export type EnvOpts = {
    clusterOrUrl?: Cluster | string;
    program?: Program;
    programId?: string;
    idl?: Idl | true;
    prioritizationFee?: number;
};

export type COptionSend = {
    clusterOrUrl: Cluster | string;
    skipSimulation: boolean;
    skipConfirmation: boolean;
    commitment: Finality;
    connection: Connection;
    retryDelay: number;
    prioritizationFee?: number;
};
export type CEnvOpts = {
    clusterOrUrl: Cluster | string;
    program: Program;
    connection: Connection;
    programId: string;
    idl: Idl;
    prioritizationFee?: number;
};
export type ReturnSwapData = { bTxs: BundleTransaction[]; swapDataAccount: string };
