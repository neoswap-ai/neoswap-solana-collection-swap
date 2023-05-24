import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

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
