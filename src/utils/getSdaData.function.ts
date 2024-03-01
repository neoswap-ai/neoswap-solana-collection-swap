import { Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import { ErrorFeedback, ScSwapData, SwapData } from "./types";
import { getProgram } from "./getProgram.obj";
import { scSwapDataToSwapData } from "./typeSwap";

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
        console.log(
            "openSda",
            openSda.map((x) => x.toBase58())
        );
        [
            "FsJgyoFyf5UdZmVvCPBhYbYajz9ShJy8hVwZNAur93cE",
            "DSWxzxKrDvRPKtjCgR3mEzx2ZzK7VPSammbZcVQiBXCY",
            "AAGKWoK1WV4adSh1dQ8LWviSW97YnxXNCPmbFSyNaqTb",
            "8RZykLrfvGNfBSDyFNQawEmXZvkUzRkLK4MuT1eqrxf",
            "D1BQhb6FV3KSTxib8ftrYahfvGKdxBctW6Yc9JMSaUXu",
            "8YJwoJ9VrqoHKxTmsMPcieK8oZRr3FNsytabKmSEmend",
            "HDh5W3X1qEKnhMP8MNb2StmWEHuRhusJN5kSbbEMUr8N",
            "9RjTFaJ5Vs8hpFPji21u5XrPV9NiqtVXHpKtYss9jYcp",
        ]
            .map((x) => new PublicKey(x))
            .map((blacklist) => {
                openSda = openSda.filter((x) => !x.equals(blacklist));
            });

        const swapDatas = (
            (await Data.program.account.swapData.fetchMultiple(openSda)).map((x) =>
                scSwapDataToSwapData(x as ScSwapData)
            ) as SwapData[]
        ).map((x, i) => {
            return { sda: openSda[i].toString(), data: x };
        });
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
