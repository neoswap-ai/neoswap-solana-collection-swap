import { Cluster } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";

export async function isConfirmedTx(Data: { transactionHash: string; cluster: Cluster | string }) {
    try {
        let program = getProgram(Data.cluster);

        const isConfirmed = await program.provider.connection.confirmTransaction({
            signature: Data.transactionHash,
            ...(await program.provider.connection.getLatestBlockhash()),
        });
        if (isConfirmed.value.err) {
            return true;
        } else throw { message: isConfirmed.value.err };
    } catch (error) {
        throw { message: error };
    }
}
