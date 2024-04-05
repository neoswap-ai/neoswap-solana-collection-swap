import { Connection, Finality, Keypair, VersionedTransaction } from "@solana/web3.js";
import { BundleTransaction, ErrorFeedback, OptionSend, TxWithSigner } from "./types";
import { delay } from "./delay";
import { checkOptionSend } from "./check";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";

export async function sendSingleTransaction(
    Data: OptionSend & {
        tx: TxWithSigner;
    }
): Promise<string> {
    let cOptionSend = checkOptionSend(Data);
    let { commitment, connection, retryDelay, skipSimulation } = cOptionSend;
    let { tx } = Data;

    if (!tx.signers) throw new Error("No signers provided");

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
export async function sendSingleBundleTransaction(
    Data: OptionSend & {
        bt: BundleTransaction;
        signer?: Keypair;
    }
): Promise<BundleTransaction> {
    let cOptionSend = checkOptionSend(Data);
    let { commitment, connection, retryDelay, skipSimulation } = cOptionSend;
    let { bt, signer } = Data;

    if (!bt.stx) {
        if (!signer) throw new Error("No signer provided");
        bt.stx = bt.tx;
        if (!isVersionedTransaction(bt.stx))
            bt.stx = new VersionedTransaction(bt.stx.compileMessage());
        bt.stx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        bt.stx.sign([signer]);
    } else {
        if (!isVersionedTransaction(bt.stx)) {
            if (bt.stx.signatures.filter((sig) => !!sig.signature).length === 0)
                throw new Error("No signature found");
        } else {
            if (bt.stx.signatures.filter((sig) => !!sig).length === 0)
                throw new Error("No signature found");
        }
    }

    if (!bt.stx) throw new Error("No signed Transaction provided");

    bt.stx!.signatures.forEach((sig, i) => {
        if (sig.toLocaleString().length === 0) throw new Error("No signers provided at index " + i);
    });

    let tx = bt.stx;
    if (!isVersionedTransaction(tx)) tx = new VersionedTransaction(tx.compileMessage());
    // if
    bt.hash = await connection.sendTransaction(tx, {
        skipPreflight: skipSimulation,
    });
    bt.status = "broadcast";

    let recentBlockhash = await connection.getLatestBlockhash();
    let keepChecking = true;

    while (keepChecking) {
        try {
            let check = await checkTransaction({
                connection: connection,
                hash: bt.hash,
                blockheight: recentBlockhash.lastValidBlockHeight,
                commitment,
                tx,
            });

            if (check === true) {
                keepChecking = false;
                bt.status = "success";
                console.log("Transaction confirmed: ", bt.hash);
            } else if (check === null) await delay(retryDelay);
            else {
                bt.status = "failed";
                throw new Error("Transaction failed");
            }
        } catch (error) {
            if (String(error).includes("Could not find transaction after 151 blocks")) {
                bt.status = "Timeout";
            }
            throw error;
        }
    }

    return bt;
}

async function checkTransaction(Data: {
    connection: Connection;
    hash: string;
    blockheight: number;
    commitment?: Finality;
    tx: VersionedTransaction;
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
