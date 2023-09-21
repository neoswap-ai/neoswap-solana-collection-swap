import { BN } from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
    ItemStatus,
    ItemStatusInfo,
    NftSwapItem,
    SwapData,
    SwapIdentity,
    SwapInfo,
    TradeStatusInfo,
} from "./types";
import { getSwapIdentityFromData } from "./getSwapIdentityFromData.function";
import { neoTypes } from "..";
import { getProgram } from "./getProgram.obj";
import { getMerkleTreeAndIndex } from "./getCNFTData.function";

export async function swapDataConverter(Data: {
    swapInfo: SwapInfo;
    clusterOrUrl: string;
    connection?: Connection;
    // preSeed?: string;
}): Promise<SwapIdentity> {
    let swapDatas: NftSwapItem[] = [];
    const connection = Data.connection
        ? Data.connection
        : getProgram({ clusterOrUrl: Data.clusterOrUrl }).provider.connection;
    for (const user in Data.swapInfo.users) {
        // console.log("user", user);

        // if (Data.swapInfo.users[user].items.get.length > 0)
        //     console.log(user, "get", Data.swapInfo.users[user].items.get);

        // if (Data.swapInfo.users[user].items.give.length > 0)
        //     console.log(user, "give", Data.swapInfo.users[user].items.give);
        await Promise.all(
            Data.swapInfo.users[user].items.give.map(async (item) => {
                // console.log(user, "give", item);

                let isCompressed = false;
                let merkleTree = new PublicKey(item.address);
                let index = new BN(0);
                try {
                    const balance = await connection.getBalance(new PublicKey(item.address));
                    // console.log("balance", balance);

                    if (balance === 0) {
                        const signa = await connection.getSignaturesForAddress(
                            new PublicKey(item.address)
                        );
                        if (signa.length === 0) {
                            isCompressed = true;
                        }
                    }
                } catch (error) {
                    isCompressed = true;
                    console.log("error", error);
                }
                if (isCompressed) {
                    let { merkleTree: merkleTreefound, index: indexFound } =
                        await getMerkleTreeAndIndex({
                            tokenId: new PublicKey(item.address),
                            Cluster: Data.clusterOrUrl.includes("mainnet")
                                ? "mainnet-beta"
                                : "devnet",
                        });
                    merkleTree = merkleTreefound;
                    index = indexFound;
                    // console.log("XXXXXXXXXXXXXXXXXX - merkleTree", merkleTree.toBase58());
                }
                item.getters.map((toDest) => {
                    console.log(
                        user,
                        " give ",
                        toDest.amount,
                        " items ",
                        item.address,
                        "to destinary",
                        toDest.address
                    );
                    swapDatas.push({
                        isNft: true,
                        isCompressed,
                        mint: new PublicKey(item.address),
                        merkleTree,
                        index,
                        owner: new PublicKey(Data.swapInfo.users[user].address),
                        destinary: new PublicKey(toDest.address),
                        amount: new BN(toDest.amount),
                        status: neoTypes.ItemStatus.NFTPending,
                    });
                });
            })
        );

        if (Data.swapInfo.users[user].items.token.amount !== 0) {
            console.log(user, "token", Data.swapInfo.users[user].items.token.amount);
            let ccurency = new PublicKey(Data.swapInfo.currency);
            swapDatas.push({
                owner: new PublicKey(Data.swapInfo.users[user].address),
                isNft: false,
                isCompressed: false,
                amount: new BN(Data.swapInfo.users[user].items.token.amount),
                destinary: ccurency,
                mint: ccurency,
                merkleTree: ccurency,
                index: new BN(0),
                status:
                    Data.swapInfo.users[user].items.token.amount < 0
                        ? ItemStatus.SolPending
                        : ItemStatus.SolToClaim,
            });
        }
    }
    // console.log("swapDatas", swapDatas);

    const itemsNfts = swapDatas.filter((x) => {
        return x.isNft == true;
    });
    const itemsSol = swapDatas.filter((x) => {
        return x.isNft == false;
    });
    const items = itemsNfts.concat(itemsSol);

    // console.log("items", items);

    return getSwapIdentityFromData({
        swapData: {
            status: 0,
            initializer: SystemProgram.programId,
            items,
            preSeed: Data.swapInfo.preSeed ? Data.swapInfo.preSeed : "0000",
            acceptedPayement: Data.swapInfo.currency
                ? new PublicKey(Data.swapInfo.currency)
                : SystemProgram.programId,
            nbItems: items.length,
        },
        clusterOrUrl: Data.clusterOrUrl,
    });
}

export async function invertedSwapDataConverter(Data: {
    swapData: SwapData;
    clusterOrUrl: string;
    connection?: Connection;
    // preSeed?: string;
}): Promise<string> {
    const swapStatusMap: { [key: number]: TradeStatusInfo } = {
        0: "initializing",
        1: "active",
        2: "finalizing",
        3: "finalized",
        4: "canceling",
        5: "canceled",
    };

    const itemStatusMap: { [key: number]: ItemStatusInfo } = {
        10: "pending",
        11: "pending",
        20: "deposited",
        21: "deposited",
        22: "deposited",
        30: "claimed",
        31: "claimed",
        110: "returned",
        111: "returned",
    };

    const status = swapStatusMap[Data.swapData.status] || undefined;

    let swapInfo: SwapInfo = {
        currency: Data.swapData.acceptedPayement.toBase58(),
        preSeed: Data.swapData.preSeed,
        status,
        users: [],
    };

    let users: {
        address: string;
        items: neoTypes.SwapUserInfo;
    }[] = [];
    let uusers: { [userId: string]: neoTypes.SwapUserInfo } = {};

    // const connection = Data.connection
    //     ? Data.connection
    //     : getProgram({ clusterOrUrl: Data.clusterOrUrl }).provider.connection;

    for (const itemNb in Data.swapData.items) {
        const item = Data.swapData.items[itemNb];
        let giversMint = uusers[item.owner.toBase58()].give.filter((x) => {
            return x.address == item.mint.toBase58();
        });
        let getterMint = uusers[item.destinary.toBase58()].get.filter((x) => {
            return x.address == item.mint.toBase58();
        });
        if (giversMint.length == 0) {
            uusers[item.owner.toBase58()].give.push({
                address: item.mint.toBase58(),
                amount: item.amount.toNumber(),
                getters: [{ address: item.destinary.toBase58(), amount: item.amount.toNumber() }],
            });
        } else {
            giversMint[0].amount += item.amount.toNumber();
            giversMint[0].getters.push({
                address: item.destinary.toBase58(),
                amount: item.amount.toNumber(),
            });
        }
        if (getterMint.length == 0) {
            uusers[item.destinary.toBase58()].get.push({
                address: item.mint.toBase58(),
                amount: item.amount.toNumber(),
                givers: [{ address: item.owner.toBase58(), amount: item.amount.toNumber() }],
            });
        }
    }
    // console.log("swapDatas", swapDatas);
    return "not implemented yet";
    // const itemsNfts = swapDatas.filter((x) => {
    //     return x.isNft == true;
    // });
    // const itemsSol = swapDatas.filter((x) => {
    //     return x.isNft == false;
    // });
    // const items = itemsNfts.concat(itemsSol);

    // // console.log("items", items);

    // return getSwapIdentityFromData({
    //     swapData: {
    //         status: 0,
    //         initializer: SystemProgram.programId,
    //         items,
    //         preSeed: Data.swapInfo.preSeed ? Data.swapInfo.preSeed : "0000",
    //         acceptedPayement: Data.swapInfo.currency
    //             ? new PublicKey(Data.swapInfo.currency)
    //             : SystemProgram.programId,
    //         nbItems: items.length,
    //     },
    //     clusterOrUrl: Data.clusterOrUrl,
    // });
}
