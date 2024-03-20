import { Connection, Finality, VersionedTransaction } from "@solana/web3.js";
import { ErrorFeedback, OptionSend, TxWithSigner } from "./types";
import { delay } from "./delay";

export async function sendSingleTransaction(
    Data: OptionSend & {
        tx: TxWithSigner;
    }
): Promise<string> {
    let { tx, clusterOrUrl, commitment, connection, retryDelay, skipSimulation, skipConfirmation } =
        Data;

    if (!retryDelay) retryDelay = 500;
    if (!tx.signers) throw new Error("No signers provided");

    if (connection && clusterOrUrl) {
    } else if (!connection && clusterOrUrl) connection = new Connection(clusterOrUrl);
    else if (!clusterOrUrl && connection) clusterOrUrl = connection.rpcEndpoint;
    else
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or connection is required",
        } as ErrorFeedback;

    let recentBlockhash = await connection.getLatestBlockhash(commitment);
    tx.tx.message.recentBlockhash = recentBlockhash.blockhash;

    tx.tx.sign(tx.signers);

    let hash = await connection.sendTransaction(tx.tx, {
        skipPreflight: skipSimulation,
    });

    let keepChecking = true;
    while (keepChecking) {
        let check = await checkTransaction({
            connection: connection,
            hash,
            blockheight: recentBlockhash.lastValidBlockHeight,
            commitment,
            tx: tx.tx,
        });

        if (check === true) {
            keepChecking = false;
            console.log("Transaction confirmed: ", hash);
        } else if (check === null) {
            await delay(retryDelay);
        } else {
            throw new Error("Transaction failed");
        }
    }

    return hash;
}

async function checkTransaction(Data: {
    connection: Connection;
    hash: string;
    blockheight: number;
    commitment?: Finality;
    tx?: VersionedTransaction;
}): Promise<boolean | null> {
    let { connection, hash, blockheight, commitment, tx } = Data;

    let status = await connection.getTransaction(hash, {
        commitment,
        maxSupportedTransactionVersion: 0,
    });

    if (status === null) {
        let block = await connection.getLatestBlockhash(commitment);

        if (blockheight + 151 < block.lastValidBlockHeight)
            throw new Error("Could not find transaction after 151 blocks.");

        if (tx)
            try {
                await connection.sendTransaction(tx);
            } catch (e) {
                console.log(e);
            }

        return null;
    }

    if (status.meta?.err) throw new Error("Transaction failed: " + JSON.stringify(status.meta.err));

    return true;
}
