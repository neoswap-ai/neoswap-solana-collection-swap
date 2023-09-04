import { BN } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ItemStatus, NftSwapItem, SwapIdentity, SwapInfo } from "./types";
import { getSwapIdentityFromData } from "./getSwapIdentityFromData.function";
import { neoTypes } from "..";

export async function swapDataConverter(Data: {
    swapInfo: SwapInfo;
    preSeed?: string;
    isDevnet?: boolean;
}): Promise<SwapIdentity> {
    let swapDatas: { [user: string]: NftSwapItem } = {};

    for (const user in Data.swapInfo) {
        if (user !== "preSeed" && user !== "currency") {
            if (Data.swapInfo[user].get.length > 0)
                console.log(user, "get", Data.swapInfo[user].get);

            if (Data.swapInfo[user].give.length > 0)
                console.log(user, "give", Data.swapInfo[user].give);
            Data.swapInfo[user].give.map((item) => {
                item.getters.map((toDest) => {
                    swapDatas[
                        "mint" +
                            item.address.toString() +
                            "/user" +
                            user.toString() +
                            "/dest" +
                            toDest.address.toString()
                    ] = {
                        isNft: true,
                        mint: new PublicKey(item.address),
                        owner: new PublicKey(user),
                        destinary: new PublicKey(toDest.address),
                        amount: new BN(toDest.amount),
                        status: neoTypes.ItemStatus.NFTPending,
                    };
                });
            });

            if (Data.swapInfo[user].token.amount !== 0) {
                console.log(user, "token", Data.swapInfo[user].token.amount);
                let ccurency = new PublicKey(Data.swapInfo.currency);
                swapDatas[user] = {
                    owner: new PublicKey(user),
                    isNft: false,
                    amount: new BN(Data.swapInfo[user].token.amount),
                    destinary: ccurency,
                    mint: ccurency,
                    status:
                        Data.swapInfo[user].token.amount < 0
                            ? ItemStatus.SolPending
                            : ItemStatus.SolToClaim,
                };
            }
        }
    }
    console.log("swapDatas", swapDatas);

    const unorderedItems = Object.values(swapDatas);
    const itemsNfts = unorderedItems.filter((x) => {
        return x.isNft == true;
    });
    const itemsSol = unorderedItems.filter((x) => {
        return x.isNft == false;
    });
    const items = itemsNfts.concat(itemsSol);

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
        isDevnet: Data.isDevnet,
    });
}
