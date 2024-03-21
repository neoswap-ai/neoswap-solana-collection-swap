import { Connection, VersionedTransaction } from "@solana/web3.js";
import { MakeSArg, MakeSwapData } from "../src/utils/types";

export async function simulateTx(
    tx: VersionedTransaction,
    connection: Connection,
    makeSwapArgs: MakeSArg,
    makeSwapData: MakeSwapData
) {
    tx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    let simu = await connection.simulateTransaction(tx);

    if (simu.value.err) {
        console.log(simu.value.logs);
        throw `${makeSwapArgs} could not make a swap ${makeSwapData} \n ${JSON.stringify(
            simu.value.err
        )}`;
    } else console.log("Simulation passed");
}
