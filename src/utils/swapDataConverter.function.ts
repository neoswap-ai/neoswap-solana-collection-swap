import { BN } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ItemStatus, NftSwapItem, SwapIdentity, SwapInfo } from "./types";
import { getSwapIdentityFromData } from "./getSwapIdentityFromData.function";
import { neoTypes } from "..";
import { getProgram } from "./getProgram.obj";
import { getMerkleTreeAndIndex } from "./getCNFTData.function";

export async function swapDataConverter(Data: {
    swapInfo: SwapInfo;
    clusterOrUrl: string;
    // preSeed?: string;
}): Promise<SwapIdentity> {
    let swapDatas: NftSwapItem[] = [];
    const connection = getProgram({ clusterOrUrl: Data.clusterOrUrl }).provider.connection;
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
                        await getMerkleTreeAndIndex({ tokenId: new PublicKey(item.address) });
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
