import { Cluster, PublicKey } from "@solana/web3.js";
import { ItemStatus, UserDataInSwap } from "./types";
import { getSwapDataAccountFromPublicKey } from "./getSwapDataAccountFromPublicKey.function";
import { getProgram } from "./getProgram.obj";
import { Program } from "@coral-xyz/anchor";

export async function userSwapDetails(Data: {
    clusterOrUrl?: Cluster | string;
    program?: Program;
    user: PublicKey;
    swapDataAccount_publicKey: PublicKey;
}): Promise<UserDataInSwap> {
    if (!!Data.clusterOrUrl && !!Data.program) {
    } else if (!!Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!!Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount_publicKey,
    });

    if (!swapData)
        throw {
            message: `no swap found at the given publicKey: ${Data.swapDataAccount_publicKey.toString()}`,
        };
        
    let allitems = [...swapData.nftItems, ...swapData.tokenItems];
    let userItems = allitems.filter((item) => item.owner.equals(Data.user));
    let receiveItems = swapData.nftItems.filter((item) => item.destinary.equals(Data.user));

    return {
        userNftToDeposit: userItems.filter((item) => item.status === ItemStatus.NFTPending),
        userNftDeposited: userItems.filter((item) => item.status === ItemStatus.NFTDeposited),

        userNftToReceive: receiveItems.filter((item) => item.status === ItemStatus.NFTDeposited),
        userNftReceived: receiveItems.filter((item) => item.status === ItemStatus.NFTClaimed),
        userNftCancelled: userItems.filter(
            (item) => item.status === ItemStatus.NFTCanceledRecovered
        ),
        userSolCancelled: userItems.filter(
            (item) => item.status === ItemStatus.SolCanceledRecovered
        ),

        userSolToDeposit: userItems.filter((item) => item.status === ItemStatus.SolPending),
        userSolDeposited: userItems.filter((item) => item.status === ItemStatus.SolDeposited),
        userSolToClaim: userItems.filter((item) => item.status === ItemStatus.SolToClaim),
        userSolClaimed: userItems.filter((item) => item.status === ItemStatus.SolClaimed),
    } as UserDataInSwap;
}
