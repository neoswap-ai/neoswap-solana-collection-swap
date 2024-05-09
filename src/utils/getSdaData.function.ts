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
        let openSda = await program.account.swapData.all();
        console.log("openSda len :", openSda.length);

        let swapDatas: {
            data: SwapData;
            sda: string;
        }[] = [];
        openSda.map((x) => {
            let sda = x.publicKey.toString();
            try {
                swapDatas.push({
                    data: scSwapDataToSwapData(x.account as ScSwapData) as SwapData,
                    sda,
                });
            } catch (error) {
                console.log(sda, "error feching ", error, x.account);
            }
        });
        console.log("swapDatas", swapDatas.length);

        return swapDatas;
    } catch (error) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
        } as ErrorFeedback;
    }
}
