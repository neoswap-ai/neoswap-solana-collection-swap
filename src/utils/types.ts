import { BN } from "@project-serum/anchor";
import { PublicKey, Signer, Transaction } from "@solana/web3.js";

export type NftSwapItem = {
    isNft: boolean;
    mint: PublicKey;
    amount: BN;
    owner: PublicKey;
    destinary: PublicKey;
    status: number;
};
export type SwapData = {
    initializer: PublicKey;
    status: number;
    nbItems: number;
    preSeed: string;
    items: Array<NftSwapItem>;
};

export type SwapIdentity = {
    swapDataAccount_publicKey: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    // preSeed: string;
    swapData: SwapData;
};

export type ApiProcessorData = {
    blockchain: string;
    type: string;
    order: number;
    description: string;
    config: any[];
}[];

export type ErrorFeedback = [
    {
        blockchain: "solana";
        type: "error";
        order: number;
        description: string | unknown;
        status?: number;
    }
];

export type TxWithSigner = { tx: Transaction; signers?: Signer[] }[];

export enum TradeStatus {
    Initializing = 0,
    WaitingToDeposit = 1,
    WaitingToClaim = 2,
    Closed = 3,

    canceling = 100,
    canceled = 101,
}
export enum ItemStatus {
    NFTPending = 10,
    SolPending = 11,

    NFTDeposited = 20,
    SolDeposited = 21,
    SolToClaim = 22,

    NFTClaimed = 30,
    SolClaimed = 31,

    NFTcanceled = 100,
    Solcanceled = 101,

    NFTcanceledRecovered = 110,
    SolcanceledRecovered = 111,
}
