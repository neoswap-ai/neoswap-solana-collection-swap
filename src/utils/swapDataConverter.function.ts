import { BN } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ItemStatus, NftSwapItem, SwapIdentity, SwapInfo } from "./types";
import { getSwapIdentityFromData } from "./getSwapIdentityFromData.function";

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
            Data.swapInfo[user].get.map((item) => {
                swapDatas[item.address] = {
                    ...swapDatas[item.address],
                    isNft: true,
                    amount: new BN(item.amount),
                    destinary: new PublicKey(user),
                    mint: new PublicKey(item.address),
                    status: 10,
                };
            });
            if (Data.swapInfo[user].give.length > 0)
                console.log(user, "give", Data.swapInfo[user].give);
            Data.swapInfo[user].give.map((item) => {
                swapDatas[item.address] = {
                    ...swapDatas[item.address],
                    owner: new PublicKey(user),
                };
            });

            if (Data.swapInfo[user].token.amount !== 0) {
                console.log(user, "token", Data.swapInfo[user].token.amount);

                swapDatas[user] = {
                    owner: new PublicKey(user),
                    isNft: false,
                    amount: new BN(Data.swapInfo[user].token.amount),
                    destinary: new PublicKey(Data.swapInfo.currency),
                    mint: new PublicKey(Data.swapInfo.currency),
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
