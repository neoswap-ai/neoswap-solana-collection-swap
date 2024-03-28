import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { checkEnvOpts, getMakeArgs } from "../utils/check";
import { bidToscBid } from "../utils/typeSwap";
import { Bid, BundleTransaction, EnvOpts, MakeSArg, UpdateArgs } from "../utils/types";
import { DESC } from "../utils/descriptions";
import { ix2vTx } from "../utils/vtx";

export async function createAddBidIx(
    Data: EnvOpts & UpdateArgs
): Promise<TransactionInstruction[]> {
    let { bids, swapDataAccount, maker } = Data;
    let cEnvOpts = checkEnvOpts(Data);
    let { program } = cEnvOpts;
    return await Promise.all(
        bids.map(
            async (bid) =>
                await program.methods
                    .addBid(bidToscBid(bid))
                    .accounts({
                        swapDataAccount,
                        maker,
                    })
                    .instruction()
        )
    );
}

export async function createAddBidBt(Data: EnvOpts & UpdateArgs): Promise<BundleTransaction> {
    return {
        description: DESC.addBid,
        tx: await ix2vTx(await createAddBidIx(Data), checkEnvOpts(Data), Data.maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}

export async function createRmBidIx(Data: EnvOpts & UpdateArgs): Promise<TransactionInstruction[]> {
    let { bids, swapDataAccount, maker } = Data;
    let cEnvOpts = checkEnvOpts(Data);
    let { program } = cEnvOpts;
    return await Promise.all(
        bids.map(
            async (bid) =>
                await program.methods
                    .removeBid(bidToscBid(bid))
                    .accounts({
                        swapDataAccount,
                        maker,
                    })
                    .instruction()
        )
    );
}

export async function createRmBidBt(Data: EnvOpts & UpdateArgs): Promise<BundleTransaction> {
    return {
        description: DESC.removeBid,
        tx: await ix2vTx(await createRmBidIx(Data), checkEnvOpts(Data), Data.maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}
