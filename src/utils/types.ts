import { Idl, Program } from "@coral-xyz/anchor";
import {
  Cluster,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { CollectionSwap } from "./neoSwap.idl";

export type AssetStandard = "core" | "native" | "hybrid" | "compressed";
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
export type TraitBid = {
  proofs: string[];
  amount: number;
  makerNeoswapFee: number;
  takerNeoswapFee: number;
  takerRoyalties: number;
  makerRoyalties: number;
};
export type TraitBidAccount = {
  owner: string;
  traitProofs: string[];
};
export type ScTraitBidAccount = {
  owner: PublicKey;
  traitProofs: PublicKey[];
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

  swapType: SwapType;

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

  swapType: ScSwapType;

  paymentMint: PublicKey;
};

export type BidAccount = {
  owner: string;
  roots: string[];
};

export type ScBidAccount = {
  owner: PublicKey;
  roots: PublicKey[];
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
  actions: string[];
  priority: number;
  status: "pending" | "broadcast" | "success" | "failed" | "Timeout";
  hash?: string;
  failedReason?: string;
  retries?: number;
};
export type Act =
  | MakeSArg
  | MakeTraitSArg
  | TakeSArg
  | ClaimSArg
  | UpdateSArgs
  | RmBidArgs
  | SetNewTime;

export type BTAct = BundleTxBase & { details: Act & { bids?: Bid[] } };

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
export type MakeTraitSArg = {
  maker: string;
  nftMintMaker: string;
  paymentMint: string;
  endDate: number;
  traitBids: TraitBid[];
};

export type TakeSArg = {
  swapDataAccount: string;
  taker: string;
  signer?: string;
  n?: number;
  nftMintTaker: string;
  bid: Bid;
  verifyTaker?: boolean;
  unwrap?: boolean;
  traitProofs?: string[];
  traitIndex?: number;
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
  program?: Program<CollectionSwap>;
  programId?: string;
  idl?: Idl | true;
  prioritizationFee?: number;
  lookUpTableAccount?: string | false;
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
  program: Program<CollectionSwap>;
  connection: Connection;
  programId: string;
  idl: Idl;
  prioritizationFee?: number;
  lookUpTableAccount?: string | false;
  cluster: Cluster;
};
export type ReturnSwapData = {
  bTxs: BundleTransaction[];
  swapDataAccount: string;
};

export enum SwapType {
  native = 0,
  traits = 1,
}

export type ScSwapType = { native: {} } | { traits: {} };

export type AppendToTx = {
  ixs: TransactionInstruction[];
  actions: string[];
  description: string;
  details: any;
  priority?: number;
};
