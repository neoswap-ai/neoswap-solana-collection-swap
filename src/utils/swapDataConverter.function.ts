import { BN } from "@coral-xyz/anchor";
import { Cluster, Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
    ItemStatus,
    ItemStatusInfo,
    NftSwapItem,
    SwapData,
    SwapIdentity,
    SwapInfo,
    TradeStatusInfo,
    TokenSwapItem,
    SwapUserInfo,
} from "./types";
import { getSwapIdentityFromData } from "./getSwapIdentityFromData.function";
// import { neoTypes } from "..";
import { getProgram } from "./getProgram.obj";
import { getMerkleTreeAndIndex } from "./getCNFTData.function";

export async function swapDataConverter(Data: {
    swapInfo: SwapInfo;
    clusterOrUrl?: Cluster | string;
    connection?: Connection;
    // preSeed?: string;
}): Promise<SwapIdentity> {
    let swapDatas: (NftSwapItem | TokenSwapItem)[] = [];
    if (!!Data.clusterOrUrl && !!Data.connection) {
    } else if (!!Data.clusterOrUrl) {
        Data.connection = getProgram({ clusterOrUrl: Data.clusterOrUrl }).provider.connection;
    } else if (!!Data.connection) {
        Data.clusterOrUrl = Data.connection.rpcEndpoint;
    }

    if (!Data.connection || !Data.clusterOrUrl)
        throw "there should be a Connection or a ClusterOrUrl";

    for (const user in Data.swapInfo.users) {
        console.log("user", user, Data.swapInfo.users[user]);

        if (Data.swapInfo.users[user].items.give.length > 0) {
            await Promise.all(
                Data.swapInfo.users[user].items.give.map(async (item) => {
                    if (!Data.connection || !Data.clusterOrUrl)
                        throw "there should be a Connection or a ClusterOrUrl";

                    let isCompressed = false;
                    let merkleTree = new PublicKey(item.address);
                    let index = new BN(0);
                    try {
                        const balance = await Data.connection.getBalance(
                            new PublicKey(item.address)
                        );
                        // console.log("balance", balance);

                        if (balance === 0) {
                            const signa = await Data.connection.getSignaturesForAddress(
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
                            // isNft: true,
                            isCompressed,
                            // isPresigning: item.presigning ? item.presigning : false,
                            mint: new PublicKey(item.address),
                            merkleTree,
                            index,
                            owner: new PublicKey(Data.swapInfo.users[user].address),
                            destinary: new PublicKey(toDest.address),
                            amount: new BN(toDest.amount),
                            status: ItemStatus.NFTPending,
                            collection: new PublicKey(item.collection),
                        });
                    });
                })
            );
        }

        if (Data.swapInfo.users[user].items.token.amount !== 0) {
            console.log(user, "token", Data.swapInfo.users[user].items.token.amount);
            let ccurency = new PublicKey(Data.swapInfo.currency);
            swapDatas.push({
                owner: new PublicKey(Data.swapInfo.users[user].address),
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
                // collection:new PublicKey(Data.swapInfo.users[user].items.)
            });
        }
    }
    // console.log("swapDatas", swapDatas);
    const nftItems: NftSwapItem[] = [];
    swapDatas.map((x) => {
        if (Object.prototype.hasOwnProperty.call(x, "mint")) nftItems.push(x as NftSwapItem);
    });
    const tokenItems: TokenSwapItem[] = swapDatas.filter((x) => {
        return !Object.prototype.hasOwnProperty.call(x, "mint"); //.includes("mint");
    });

    console.log("nftItems", nftItems, "tokenItems", tokenItems);

    // const items = itemsNfts.concat(itemsSol);

    // console.log("items", items);

    return getSwapIdentityFromData({
        swapData: {
            status: 0,
            initializer: SystemProgram.programId,
            nftItems,
            tokenItems,
            preSeed: Data.swapInfo.preSeed ? Data.swapInfo.preSeed : "0000",
            acceptedPayement: Data.swapInfo.currency
                ? new PublicKey(Data.swapInfo.currency)
                : SystemProgram.programId,
            nbItems: { nft: nftItems.length, tokens: tokenItems.length },
        },
        clusterOrUrl: Data.clusterOrUrl,
    });
}

export function invertedSwapDataConverter(Data: { swapData: SwapData }): SwapInfo {
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

    let uusers: { [userId: string]: SwapUserInfo } = {};

    for (const itemNb in Data.swapData.nftItems) {
        const item = Data.swapData.nftItems[itemNb];
        if (!!!uusers[item.owner.toBase58()])
            uusers[item.owner.toBase58()] = { give: [], get: [], token: { amount: 0 } };
        if (!!!uusers[item.destinary.toBase58()])
            uusers[item.destinary.toBase58()] = { give: [], get: [], token: { amount: 0 } };
        let giversMint = uusers[item.owner.toBase58()].give.filter((x) => {
            return x.address == item.mint.toBase58();
        });
        let getterMint = uusers[item.destinary.toBase58()].get.filter((x) => {
            return x.address == item.mint.toBase58();
        });

        if (giversMint.length == 0) {
            uusers[item.owner.toBase58()].give.push({
                address: item.mint.toBase58(),
                collection: "",
                amount: item.amount.toNumber(),
                getters: [
                    {
                        address: item.destinary.toBase58(),
                        amount: item.amount.toNumber(),
                        status: itemStatusMap[item.status],
                    },
                ],
            });
        } else {
            giversMint[0].amount += item.amount.toNumber();
            giversMint[0].getters.push({
                address: item.destinary.toBase58(),
                amount: item.amount.toNumber(),
                status: itemStatusMap[item.status],
            });
        }
        if (getterMint.length == 0) {
            uusers[item.destinary.toBase58()].get.push({
                address: item.mint.toBase58(),
                collection: "",
                amount: item.amount.toNumber(),
                givers: [
                    {
                        address: item.owner.toBase58(),
                        amount: item.amount.toNumber(),
                        status: itemStatusMap[item.status],
                    },
                ],
            });
        }
    }
    Data.swapData.tokenItems.map((item) => {
        if (uusers[item.owner.toBase58()].token.amount !== 0) throw "already tokens to send";
        uusers[item.owner.toBase58()].token.amount = item.amount.toNumber();
    });

    // for (const itemNb in uusers) {
    //     console.log(
    //         itemNb,
    //         uusers[itemNb].status,
    //         "tokens",
    //         uusers[itemNb].token,
    //         "uusers \n give",
    //         uusers[itemNb].give[0],
    //         "\n get",
    //         uusers[itemNb].get[0]
    //     );
    // }
    swapInfo.users = Object.keys(uusers).map((user) => {
        return { address: user, items: uusers[user] };
    });

    return swapInfo;
}
