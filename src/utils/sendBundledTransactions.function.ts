import { Cluster, Keypair, Signer, Transaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";

// const getProgram = require("./getProgram.obj");

export async function sendBundledTransactions(
    txsWithoutSigners: {
        tx: Transaction;
        signers?: Signer[];
    }[],
    signer: Keypair,
    cluster: Cluster
) {
    try {
        // console.log(txWithSigners);
        let { program } = getProgram(cluster, signer);
        const txsWithSigners = await Promise.all(
            txsWithoutSigners.map((txWithoutSigners) => {
                txWithoutSigners.signers = [signer];
                txWithoutSigners.tx.feePayer = signer.publicKey;
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
// module.exports = sendBundledTransactions;
