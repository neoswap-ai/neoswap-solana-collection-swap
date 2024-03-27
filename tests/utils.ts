import { Connection, VersionedTransaction } from "@solana/web3.js";
import { MakeSArg, MakeSwapData } from "../src/utils/types";

export async function simulateTx(tx: VersionedTransaction, connection: Connection) {
    try {
        tx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        let simu = await connection.simulateTransaction(tx);

        if (simu.value.err) {
            console.log(simu.value);
            console.log(simu.value.err);
            throw "error simulating swap";
        } else console.log("Simulation passed");
    } catch (e) {
        console.log(e);
        throw "Simulation failed";
    }
}
