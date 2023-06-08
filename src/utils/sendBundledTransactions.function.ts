import { Cluster, Keypair, Signer, Transaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { TxWithSigner } from "./types";

// const getProgram  from "./getProgram.obj");

export async function sendBundledTransactions(Data: {
    txsWithoutSigners: TxWithSigner;
    signer: Keypair;
    cluster: Cluster | string;
}) {
    try {
        // console.log(txWithSigners);

        let program= getProgram(Data.cluster, Data.signer);
        const txsWithSigners = await Promise.all(
            Data.txsWithoutSigners.map((txWithoutSigners) => {
                txWithoutSigners.signers = [Data.signer];
                txWithoutSigners.tx.feePayer = Data.signer.publicKey;
                return txWithoutSigners;
            })
        );
        // console.log("txsWithSigners", txsWithSigners);
        console.log(
            "User ",
            Data.signer.publicKey.toBase58(),
            " has found to have ",
            txsWithSigners.length,
            " transaction(s) to send \nBroadcasting to blockchain ..."
        );
        if (!program.provider.sendAll)
            throw { message: "your provider is not an AnchorProvider type" };

        const transactionHashes = await program.provider.sendAll(txsWithSigners, {
            skipPreflight: true,
        });
        console.log(transactionHashes);
        return { transactionHashes };
    } catch (error) {
        throw error;
    }
}
