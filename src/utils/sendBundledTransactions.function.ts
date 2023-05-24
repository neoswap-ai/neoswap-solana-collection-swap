import { Cluster, Keypair, Signer, Transaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";

// const getProgram  from "./getProgram.obj");

export async function sendBundledTransactions(Data: {
    txsWithoutSigners: {
        tx: Transaction;
        signers?: Signer[];
    }[];
    signer: Keypair;
    cluster: Cluster | string;
}) {
    try {
        // console.log(txWithSigners);
        let { program } = getProgram(Data.cluster, Data.signer);
        const txsWithSigners = await Promise.all(
            Data.txsWithoutSigners.map((txWithoutSigners) => {
                txWithoutSigners.signers = [Data.signer];
                txWithoutSigners.tx.feePayer = Data.signer.publicKey;
                return txWithoutSigners;
            })
        );
        // console.log("txsWithSigners", txsWithSigners);
        if (!program.provider.sendAll)
            throw { message: "your provider is not an AnchorProvider type" };

        const transactionHashes = await program.provider.sendAll(txsWithSigners, {
            // skipPreflight: true,
        });
        // console.log(transactionHashes);
        return { transactionHashes };
    } catch (error) {
        throw error;
    }
}
