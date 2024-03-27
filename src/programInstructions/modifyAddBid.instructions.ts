import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { checkEnvOpts, getMakeArgs } from "../utils/check";
import { bidToscBid } from "../utils/typeSwap";
import { Bid, BundleTransaction, EnvOpts, MakeSArg, UpdateArgs } from "../utils/types";
import { DESC } from "../utils/descriptions";
import { ix2vTx } from "../utils/vtx";

export async function createAddBidIx(Data: EnvOpts & UpdateArgs): Promise<BundleTransaction> {
    let { bid, swapDataAccount, maker } = Data;
    let cEnvOpts = checkEnvOpts(Data);
    let { program, connection } = cEnvOpts;
    const addBidIx = await program.methods
        .addBid(bidToscBid(bid))
        .accounts({
            swapDataAccount,
            maker,
        })
        .instruction();
    return {
        description: DESC.addBid,
        tx: await ix2vTx([addBidIx], cEnvOpts, maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}

export async function createRmBidIx(Data: EnvOpts & UpdateArgs): Promise<BundleTransaction> {
    let { bid, swapDataAccount, maker } = Data;
    let cEnvOpts = checkEnvOpts(Data);
    let { program } = cEnvOpts;
    const rmBidIx = await program.methods
        .removeBid(bidToscBid(bid))
        .accounts({
            swapDataAccount,
            maker,
        })
        .instruction();

    return {
        description: DESC.removeBid,
        tx: await ix2vTx([rmBidIx], cEnvOpts, maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}
