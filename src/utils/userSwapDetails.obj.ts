import { Cluster, PublicKey } from "@solana/web3.js";
import { ItemStatus, UserDataInSwap } from "./types";
import { getSwapDataAccountFromPublicKey } from "./getSwapDataAccountFromPublicKey.function";
import { getProgram } from "./getProgram.obj";
import { Program } from "@project-serum/anchor";

export async function userSwapDetails(Data: {
    clusterOrUrl: Cluster | string;
    user: PublicKey;
    swapDataAccount_publicKey: PublicKey;
    program?: Program;
}): Promise<UserDataInSwap> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
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

    return {
        userNftToDeposit: userItems.filter((item) => item.status === ItemStatus.NFTPending),
        userNftDeposited: userItems.filter((item) => item.status === ItemStatus.NFTDeposited),

        userNftToReceive: receiveItems.filter((item) => item.status === ItemStatus.NFTDeposited),
        userNftReceived: receiveItems.filter((item) => item.status === ItemStatus.NFTClaimed),
        userNftCancelled: userItems.filter(
            (item) => item.status === ItemStatus.NFTcanceledRecovered
        ),
        userSolCancelled: userItems.filter(
            (item) => item.status === ItemStatus.SolcanceledRecovered
        ),

        userSolToDeposit: userItems.filter((item) => item.status === ItemStatus.SolPending),
        userSolDeposited: userItems.filter((item) => item.status === ItemStatus.SolDeposited),
        userSolToClaim: userItems.filter((item) => item.status === ItemStatus.SolToClaim),
        userSolClaimed: userItems.filter((item) => item.status === ItemStatus.SolClaimed),
    } as UserDataInSwap;
}
