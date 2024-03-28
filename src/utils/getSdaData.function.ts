import { Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import { ErrorFeedback, ScSwapData, SwapData } from "./types";
import { getProgram } from "./getProgram.obj";
import { scSwapDataToSwapData } from "./typeSwap";
import { AVOID_LIST } from "./avoidList";

export async function getSdaData(Data: {
    clusterOrUrl?: Cluster | string;
    program?: Program;
    swapDataAccount: string;
}): Promise<SwapData | undefined> {
    if (!!Data.clusterOrUrl && !!Data.program) {
    } else if (!!Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!!Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    try {
        const swapData = (await Data.program.account.swapData.fetch(
            Data.swapDataAccount
        )) as ScSwapData;
        console.log(Data.swapDataAccount, swapData.seed);

        if (!swapData) {
            throw `No SwapData found ${Data.swapDataAccount}`;
        } else {
            return scSwapDataToSwapData(swapData);
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
}): Promise<{ sda: string; data: SwapData }[]> {
    if (!!Data.clusterOrUrl && !!Data.program) {
    } else if (!!Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!!Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    try {
        console.log("Program Id", Data.program.programId.toString());

        let openSda = (
            await Data.program.provider.connection.getProgramAccounts(Data.program.programId)
        ).map((x) => x.pubkey);

        AVOID_LIST.map((x) => new PublicKey(x)).map((blacklist) => {
            openSda = openSda.filter((x) => !x.equals(blacklist));
        });
        console.log(
            "openSda",
            openSda.map((x) => x.toBase58())
        );
        console.log(openSda.length);
        // let i = 0;
        // for (const sda in openSda) {
        //     if (Object.prototype.hasOwnProperty.call(openSda, sda)) {
        //         const element = openSda[sda];
        //         try {
        //             await Data.program.account.swapData.fetch(element);
        //         } catch (error) {
        //             console.log(i, "error", sda);
        //         }
        //         i++;
        //     }
        // }
        const swapDatas = (
            (await Data.program.account.swapData.fetchMultiple(openSda)).map((x) =>
                scSwapDataToSwapData(x as ScSwapData)
            ) as SwapData[]
        ).map((x, i) => {
            return { sda: openSda[i].toString(), data: x };
        });
        console.log("swapDatas", swapDatas);
        return swapDatas;

        // if (!swapDatas) {
        //     throw `No SwapData found ${openSda}`;
        // } else {
        // }
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}
