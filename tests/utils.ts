import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";

export async function simulateTx(tx: VersionedTransaction | Transaction, connection: Connection) {
    try {
        if (!isVersionedTransaction(tx)) tx = new VersionedTransaction(tx.compileMessage());
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
