import { Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import { ErrorFeedback, SwapData, SwapInfo } from "./types";
import { getProgram } from "./getProgram.obj";

export async function getSdaData(Data: {
    clusterOrUrl?: Cluster | string;
    program?: Program;
    swapDataAccount_publicKey: PublicKey;
}): Promise<SwapData | undefined> {
    if (!!Data.clusterOrUrl && !!Data.program) {
    } else if (!!Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!!Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    try {
        const swapData = (await Data.program.account.swapData.fetch(
            Data.swapDataAccount_publicKey
        )) as SwapData;
        console.log(Data.swapDataAccount_publicKey.toBase58(), swapData.seed);

        if (!swapData) {
            throw `No SwapData found ${Data.swapDataAccount_publicKey.toBase58()}`;
        } else {
            return swapData;
        }
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}

export async function getOpenSda(Data: {
    clusterOrUrl?: Cluster | string;
    program?: Program;
}): Promise<SwapData[]> {
    if (!!Data.clusterOrUrl && !!Data.program) {
    } else if (!!Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!!Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    try {
        let openSda = (
            await Data.program.provider.connection.getProgramAccounts(Data.program.programId)
        ).map((x) => x.pubkey);

        const swapDatas = (await Data.program.account.swapData.fetchMultiple(
            openSda
        )) as SwapData[];
        console.log("swapDatas", swapDatas);

        if (!swapDatas) {
            throw `No SwapData found ${openSda}`;
        } else {
            return swapDatas;
        }
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}
