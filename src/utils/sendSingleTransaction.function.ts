import { Cluster, Connection, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ErrorFeedback } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";
import bs58 from "bs58";

export async function sendSingleTransaction(Data: {
    tx: VersionedTransaction;
    signer: Keypair;
    clusterOrUrl?: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
    connection?: Connection;
}): Promise<string> {
    if (!Data.skipSimulation) Data.skipSimulation = false;
    if (Data.connection && Data.clusterOrUrl) {
    } else if (!Data.connection && Data.clusterOrUrl) {
        Data.connection = new Connection(Data.clusterOrUrl);
    } else if (!Data.clusterOrUrl && Data.connection) {
        Data.clusterOrUrl = Data.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }

    Data.tx.message.recentBlockhash = (await Data.connection.getLatestBlockhash()).blockhash;
    Data.tx.sign([Data.signer]);
    console.log(
        "User ",
        Data.signer.publicKey.toBase58(),
        " has found a transaction to send \nBroadcasting " +
            bs58.encode(Data.tx.signatures[0]) +
            " to blockchain ..."
    );

    let hash = await Data.connection.sendRawTransaction(Data.tx.serialize(), {
        skipPreflight: Data.skipSimulation,
        maxRetries:5
    });

    if (!Data.skipConfirmation) {
        const confirmArray = await isConfirmedTx({
            clusterOrUrl: Data.clusterOrUrl,
            transactionHashs: [hash],
            connection: Data.connection,
        });
        confirmArray.forEach((confirmTx) => {
            console.log("validating ", confirmTx.transactionHash, " ...");

            if (!confirmTx.isConfirmed)
                throw {
                    blockchain: "solana",
                    status: "error",
                    message: `transaction was not confirmed ${confirmArray.toString()}`,
                } as ErrorFeedback;
        });
    }

    return hash;
}
