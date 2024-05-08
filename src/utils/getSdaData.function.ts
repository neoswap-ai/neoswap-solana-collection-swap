import { PublicKey } from "@solana/web3.js";
import { EnvOpts, ErrorFeedback, ScSwapData, SwapData } from "./types";
import { scSwapDataToSwapData } from "./typeSwap";
import { AVOID_LIST } from "./avoidList";
import { checkEnvOpts } from "./check";
import { VERSION } from "./const";

export async function getSdaData(
    Data: EnvOpts & {
        swapDataAccount: string;
    }
): Promise<SwapData | undefined> {
    console.log("getSdaData", VERSION);
    let { swapDataAccount } = Data;
    let { program } = await checkEnvOpts(Data);

    try {
        const swapData = (await program.account.swapData.fetch(swapDataAccount)) as ScSwapData;
        console.log(swapDataAccount, swapData.seed);

        if (!swapData) {
            throw `No SwapData found ${swapDataAccount}`;
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

export async function getOpenSda(
    Data: EnvOpts & {
        ignoreList?: string[];
    }
): Promise<{ sda: string; data: SwapData }[]> {
    console.log("getOpenSda", VERSION);

    let { program } = await checkEnvOpts(Data);
    try {
        console.log("Program Id", program.programId.toString());

        let openSda = (await program.provider.connection.getProgramAccounts(program.programId)).map(
            (x) => x.pubkey
        );
        let ignoreList = Data.ignoreList || [];

        AVOID_LIST.concat(ignoreList)
            .map((x) => new PublicKey(x))
            .map((blacklist) => {
                openSda = openSda.filter((x) => !x.equals(blacklist));
            });
        console.log(
            "openSda",
            openSda.map((x) => x.toBase58())
        );
        console.log("openSda len :", openSda.length);
        try {
            let batchSize = 10;
            let swapDatas: {
                sda: string;
                data: SwapData;
            }[] = [];
            for (let i = 0; i < openSda.length; i += batchSize) {
                const batch = openSda.slice(i, i + batchSize);

                let fetchSDAs1 = await program.account.swapData.fetchMultiple(batch);
                let fetchedDatas = fetchSDAs1.map((x, i) => {
                    return {
                        sda: batch[i].toString(),
                        data: scSwapDataToSwapData(x as ScSwapData) as SwapData,
                    };
                });
                swapDatas.push(...fetchedDatas);
            }
            console.log("swapDatas", swapDatas);
            return swapDatas;
        } catch (error) {
            let i = 0;
            let issue = false;
            for (const sda in openSda) {
                const element = openSda[sda];
                try {
                    await program.account.swapData.fetch(element);
                } catch (error) {
                    console.log(i, "error", openSda[sda].toString(), error);
                    issue = true;
                }
                i++;
            }
            if (issue) throw "Error fetching swapDatas";
            else throw error;
        }
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
