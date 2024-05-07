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
            const swapDatas = (
                (await program.account.swapData.fetchMultiple(openSda)).map((x) =>
                    scSwapDataToSwapData(x as ScSwapData)
                ) as SwapData[]
            ).map((x, i) => {
                return { sda: openSda[i].toString(), data: x };
            });
            console.log("swapDatas", swapDatas);
            return swapDatas;
        } catch {
            let i = 0;
            for (const sda in openSda) {
                if (Object.prototype.hasOwnProperty.call(openSda, sda)) {
                    const element = openSda[sda];
                    try {
                        await program.account.swapData.fetch(element);
                    } catch (error) {
                        console.log(i, "error", openSda[sda].toString());
                    }
                    i++;
                }
            }
            throw "Error fetching swapDatas";
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
