import { Program } from "@project-serum/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import { ErrorFeedback, SwapData, SwapInfo } from "./types";
import { invertedSwapDataConverter } from "./swapDataConverter.function";
import { getProgram } from "./getProgram.obj";

export async function getSwapDataAccountFromPublicKey(Data: {
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

export async function getDataFromSwapdataAccountPublickey(Data: {
    clusterOrUrl?: Cluster | string;
    program?: Program;
    swapDataAccount_publicKey: PublicKey;
}): Promise<SwapInfo> {
    if (!!Data.clusterOrUrl && !!Data.program) {
    } else if (!!Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!!Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else throw "there should be a program or a cluster";
    try {
        const swapData = (await Data.program.account.swapData.fetch(
            Data.swapDataAccount_publicKey
        )) as SwapData;

        if (swapData) {
            return invertedSwapDataConverter({ swapData });
        } else {
            throw {
                blockchain: "solana",
                status: "error",
                message: `No SwapData found ${Data.swapDataAccount_publicKey.toBase58()}`,
            } as ErrorFeedback;
        }
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}
