import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export type SwapData = { initializer: PublicKey; status: number; items: Array<NftSwapItem> };

type NftSwapItem = {
    isNft: boolean;
    mint: PublicKey;
    amount: BN;
    owner: PublicKey;
    destinary: PublicKey;
    status: number;
};

export type SDA = {
    swapDataAccount_publicKey: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    preSeed: string;
    swapData: SwapData;
};
