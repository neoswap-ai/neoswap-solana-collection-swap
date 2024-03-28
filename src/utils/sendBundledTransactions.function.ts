import {
    Cluster,
    Connection,
    Finality,
    Keypair,
    Transaction,
    VersionedTransaction,
} from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { BundleTransaction, COptionSend, ErrorFeedback, OptionSend, TxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
    sendSingleBundleTransaction,
    sendSingleTransaction,
} from "./sendSingleTransaction.function";
import { checkOptionSend, isVersionedArray } from "./check";
import { addPriorityFee } from "./fees";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";

export async function sendBundledTransactions(
    Data: COptionSend & {
        txsWithoutSigners: TxWithSigner[];
        signer: Keypair;
    }
): Promise<string[]> {
    let cOptionSend = checkOptionSend(Data);
    let { clusterOrUrl, skipSimulation, connection } = cOptionSend;
    let { txsWithoutSigners, signer, skipConfirmation } = Data;
    try {
        const provider = getProgram({
            clusterOrUrl,
            signer,
        }).provider;

        const txsWithSigners = txsWithoutSigners.map((txWithSigners) => {
            txWithSigners.signers = [signer];
            return txWithSigners;
        });

        console.log(
            "User ",
            signer.publicKey.toBase58(),
            " has found to have ",
            txsWithoutSigners.length,
            " transaction(s) to send \nBroadcasting to blockchain ..."
        );
        if (!provider.sendAll) throw { message: "your provider is not an AnchorProvider type" };

        let transactionHashs = await provider.sendAll(txsWithSigners, {
            maxRetries: 5,
            skipPreflight: skipSimulation,
        });

        if (!skipConfirmation) {
            const confirmArray = await isConfirmedTx({
                clusterOrUrl,
                transactionHashs,
                connection,
            });
            confirmArray.forEach((confirmTx) => {
                console.log("validating ", confirmTx.transactionHash, " ...");

                if (!confirmTx.isConfirmed)
                    throw {
                        blockchain: "solana",
                        status: "error",
                        message: `some transaction were not confirmed ${confirmArray.toString()}`,
                    } as ErrorFeedback;
            });
        }

        return transactionHashs;
    } catch (error) {
        throw error;
    }
}

export async function sendBundledTransactionsV2(
    Data: OptionSend & {
        bundleTransactions: BundleTransaction[];
        signer?: Keypair;
    }
): Promise<BundleTransaction[]> {
    let cOptionSend = checkOptionSend(Data);
    let { clusterOrUrl, prioritizationFee, skipSimulation, retryDelay, connection } = cOptionSend;

    let { bundleTransactions, signer } = Data;

    let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    if (!signer)
        bundleTransactions.map((tx) => {
            tx.stx!.signatures.forEach((sig, i) => {
                if (sig.toLocaleString().length === 0)
                    throw {
                        blockchain: "solana",
                        status: "error",
                        message: `signer is required for unsigned Tx`,
                    } as ErrorFeedback;
            });
        });
    else {
        let tempSigner = signer;
        bundleTransactions.forEach(async (BT) => {
            if (isVersionedTransaction(BT.tx)) {
                if (prioritizationFee)
                    console.warn("prioritizationFee is not supported for VersionedTransaction");
                BT.tx.message.recentBlockhash = recentBlockhash;
                BT.stx = BT.tx;
                BT.stx.sign([tempSigner]);
            } else {
                if (prioritizationFee) BT.tx = await addPriorityFee(BT.tx, prioritizationFee);

                BT.tx.feePayer = tempSigner.publicKey;
                BT.tx.recentBlockhash = recentBlockhash;
                BT.stx = BT.tx;
                BT.stx.sign(tempSigner);
            }
        });
    }
    console.log(
        "User ",
        signer ? signer.publicKey.toBase58() : "- unknown signer -",
        " has found to have ",
        bundleTransactions.length,
        " transaction(s) to send \nBroadcasting to blockchain ..."
    );

    let transactionHashs = [];
    for (let i = 0; i < bundleTransactions.length; i++) {
        let hash = await sendSingleBundleTransaction({
            bt: bundleTransactions[i],
            ...cOptionSend,
        });
        transactionHashs.push(hash);
    }
    return transactionHashs;
}
