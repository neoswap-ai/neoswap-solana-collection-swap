import { Connection, PublicKey } from "@solana/web3.js";
import { createMakeSwapInstructions } from "../src/programInstructions/makeSwap.instructions";
import { Bid, EnvOpts, MakeSArg } from "../src/utils/types";
import { NETWORK_URL } from "./consts";
import { now } from "@metaplex-foundation/js";
import { NATIVE_MINT } from "@solana/spl-token";
import { simulateTx } from "./utils";
import { u32, u8, struct, Layout } from "@solana/buffer-layout";
import { publicKey, u64, bigInt, bool } from "@solana/buffer-layout-utils";
import { base64, bs58, hex } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

let makeSwapArgs = {
    bid: {
        amount: 1000,
        collection: "69k55dCTwiUPNgaTZ8FVMADorTvEGJEGuAGEB7m1qB1S",
        makerNeoswapFee: 100,
        makerRoyalties: 200,
        takerNeoswapFee: 400,
        takerRoyalties: 500,
    },
    endDate: now().toNumber() + 86400,
    maker: "CpB3k2pkmDK5uQVXH6YBKe8uQQsjBBaNwwnoauKkR6i4",
    nftMintMaker: "AjMgHhfhNNXTcsg8xBdVkx615FUo2ixM8Em5JWwcvyTM",
    paymentMint: NATIVE_MINT.toString(),
} as MakeSArg;

let maker = "E584zfdPBfdbS8Px6nYQkkCBFGicYwW413R6SrvyEt3c";
let collection = new PublicKey("Hrn7amdBfEfyGZ2Y1E2xLor4Q2cz1dCEcNnKWC1ap9sS");
export async function deserialize(connection: Connection) {
    // const txData = await connection.getParsedTransaction(
    //     "5Umjnad1oBkBtCSVV6P72RrvnSZmP7fGVMfDKjRaR5ZvvRwUbHzbHrqmkJEpRKVogpvX691ASJ7fEbLjB2KGvrBe"
    // );
    // console.log(txData);
    // console.log("XXXXX", txData?.transaction.message);
    // console.log("inner");
    // txData?.meta?.innerInstructions?.map((ix) => {
    //     console.log("InnerIx", ix.index);
    //     ix.instructions.map((i) => {
    //         console.log(i);
    //     });
    // });

    // console.log("ix");
    // txData?.transaction.message.instructions?.map((ix) => {
    //     console.log(ix);
    // });

    let dataHash =
        "RqmdpCTtpHmvAVquizEeyxKSnkDdH92fPNVmCeuJ5zFWhipWLWvnXSheq5YSP6sTraMgzPsLDAZmRCASjVKiQ5wK6uX4N5w5uVRbCgSy7DjGb9hUHeVxdywM";
    const deserialized = MakeSwapLayout.decode(base64.decode(dataHash));
    console.log("ARGS FROM TX", deserialized);

    let dth =
        //"353ce5f39d5e62ba"
        "fa7b75dff213bd37013e5a578666f6845a67ce71e19587fd109263abd9cf0635ea4f470000000000390a070000000000390a070000000000211502000000000000000000000000005dd9fd6500000000";
    let dthB = Buffer.from(dth, "hex");
    console.log("DTHB", dthB);

    const deserialized2 = MakeSwapLayout.decode(dthB);
    console.log("ARGS FROM TX2", deserialized2);
    console.log("ARGS FROM TX2", deserialized2.bid.collection.toString());

    console.log(collection.toBuffer());

    // // ("bid_to_add Bid
    // let bb = {
    //     collection: "Hrn7amdBfEfyGZ2Y1E2xLor4Q2cz1dCEcNnKWC1ap9sS",
    //     amount: 4673514,
    //     maker_neoswap_fee: 461369,
    //     taker_neoswap_fee: 461369,
    //     taker_royalties: 136481,
    //     maker_royalties: 0,
    // };
    //  ");

    // let dtahs2 =
    //     "37XhgGsfB31PPTmbUpS1oTsKTkqvoe5tqU2UYE7gyHCWnzkmiptjQWww3jej29faoGi8GrNuDmNMihaNxug76FyyzorjRQpeYbQHoVAL7CPBWgrRc3TWvzKGwkQ3bU28fGK7r2NuLiBvYyDRrBKadnCheWXgJf9EUZyP6tRpq6khRx4WhCzdhWtxaXTekwwcXomwVHZmW4d6ymqGwDsSgCBV7thFiGdV64kcqYcSFwLhNaJmZurEHPcB";
    // const deserialized2 = MakeSwapLayout.decode(bs58.decode(dtahs2));
    // console.log("ARGS FROM TX2", deserialized2);

    // let dtahs3 = "E6NUis";
    // const deserialized3 = MakeSwapLayout.decode(bs58.decode(dtahs3));
    // console.log("ARGS FROM TX3", deserialized3);

    // try {
    //     let makeSwapData = await createMakeSwapInstructions({ ...makeSwapArgs, ...envOpts });
    //     await simulateTx(makeSwapData.bTx.tx, connection, makeSwapArgs, makeSwapData);
    // } catch (error) {
    //     console.log("Error", error);
    //     throw "MakeSwap Test failed";
    // }
}

export interface MakeSwapArgs {
    endDate: bigint;
    bid: Bidz;
}

export interface Bidz {
    collection: PublicKey;
    amount: bigint;
    makerNeoswapFee: bigint;
    takerNeoswapFee: bigint;
    takerRoyalties: bigint;
    makerRoyalties: bigint;
}

export const BidLayoutz = struct<Bidz>([
    publicKey("collection"),
    bigInt("amount"),
    bigInt('makerNeoswapFee'),
    bigInt("takerNeoswapFee"),
    bigInt("takerRoyalties"),
    bigInt("makerRoyalties"),
]);
export const MakeSwapLayout = struct<MakeSwapArgs>([BidLayoutz.replicate("bid"), u64("endDate")]);
