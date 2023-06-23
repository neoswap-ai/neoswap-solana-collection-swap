import { Cluster, Keypair, Signer, Transaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { TxWithSigner } from "./types";

// const getProgram  from "./getProgram.obj");

export async function sendBundledTransactions(Data: {
    txsWithoutSigners: TxWithSigner;
    signer: Keypair;
    cluster: Cluster | string;
    skipPreflight?: boolean;
}) {
    try {
        // console.log(txWithSigners);

        let program = getProgram(Data.cluster, Data.signer);
        const txsWithSigners = Data.txsWithoutSigners.map((txWithSigners) => {
            txWithSigners.signers = [Data.signer];
            txWithSigners.tx.feePayer = Data.signer.publicKey;
            return txWithSigners;
        });

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

        const transactionHashs = await program.provider.sendAll(txsWithSigners, {
            skipPreflight: Data.skipPreflight,
        });

        return { transactionHashs };
    } catch (error) {
        throw error;
    }
}
