import { Cluster, PublicKey } from "@solana/web3.js";
import { ItemStatus, NftSwapItem, SwapData } from "./types";
import { getSwapDataAccountFromPublicKey } from "./getSwapDataAccountFromPublicKey.function";
import { getProgram } from "./getProgram.obj";

export async function userSwapDetails(Data: {
    cluster: Cluster;
    user: PublicKey;
    swapDataAccount_publicKey: PublicKey;
}): Promise<{
    userNftToDeposit: NftSwapItem[];
    userNftDeposited: NftSwapItem[];

    userNftToReceive: NftSwapItem[];
    userNftReceived: NftSwapItem[];

    userNftCancelled: NftSwapItem[];
    userSolCancelled: NftSwapItem[];

    userSolToDeposit: NftSwapItem[];
    userSolDeposited: NftSwapItem[];
    userSolToClaim: NftSwapItem[];
    userSolClaimed: NftSwapItem[];
}> {
    const program = getProgram(Data.cluster);
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount_publicKey,
    });

    if (!swapData)
        throw {
            message: `no swap found at the given publicKey: ${Data.swapDataAccount_publicKey.toString()}`,
        };

    let userItems = swapData.items.filter((item) => item.owner.equals(Data.user));
    let receiveItems = swapData.items.filter((item) => item.destinary.equals(Data.user));

    let userNftToDeposit = userItems.filter((item) => item.status === ItemStatus.NFTPending);
    let userNftDeposited = userItems.filter((item) => item.status === ItemStatus.NFTDeposited);

    let userNftToReceive = receiveItems.filter((item) => item.status === ItemStatus.NFTDeposited);
    let userNftReceived = receiveItems.filter((item) => item.status === ItemStatus.NFTClaimed);

    let userNftCancelled = userItems.filter((item) => item.status === ItemStatus.NFTcanceledRecovered);
    let userSolCancelled = userItems.filter((item) => item.status === ItemStatus.SolcanceledRecovered);

    let userSolToDeposit = userItems.filter((item) => item.status === ItemStatus.SolPending);
    let userSolDeposited = userItems.filter((item) => item.status === ItemStatus.SolDeposited);
    let userSolToClaim = userItems.filter((item) => item.status === ItemStatus.SolToClaim);
    let userSolClaimed = userItems.filter((item) => item.status === ItemStatus.SolClaimed);
    
    return {
        userNftToDeposit,
        userNftDeposited,

        userNftToReceive,
        userNftReceived,

        userNftCancelled,
        userSolCancelled,

        userSolToDeposit,
        userSolDeposited,
        userSolToClaim,
        userSolClaimed
    };
}
