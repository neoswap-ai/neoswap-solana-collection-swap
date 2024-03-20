import { Cluster, Connection, Finality, Keypair, VersionedTransaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ErrorFeedback, TxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";
import { delay } from "./delay";
import { sendSingleTransaction } from "./sendSingleTransaction.function";

export async function sendBundledTransactions(Data: {
    txsWithoutSigners: TxWithSigner[];
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
    provider?: AnchorProvider;
}): Promise<string[]> {
    try {
        const provider = Data.provider
            ? Data.provider
            : getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer }).provider;

        const txsWithSigners = Data.txsWithoutSigners.map((txWithSigners) => {
            txWithSigners.signers = [Data.signer];
            return txWithSigners;
        });

        console.log(
            "User ",
            Data.signer.publicKey.toBase58(),
            " has found to have ",
            Data.txsWithoutSigners.length,
            " transaction(s) to send \nBroadcasting to blockchain ..."
        );
        if (!provider.sendAll) throw { message: "your provider is not an AnchorProvider type" };
        if (!Data.skipConfirmation) Data.skipConfirmation = false;

        let transactionHashs = await provider.sendAll(txsWithSigners, {
            maxRetries: 5,
            skipPreflight: Data.skipConfirmation,
        });

        if (!Data.skipConfirmation) {
            const confirmArray = await isConfirmedTx({
                clusterOrUrl: Data.clusterOrUrl,
                transactionHashs,
                connection: provider.connection,
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

export async function sendBundledTransactionsV2(Data: {
    txsWithoutSigners: TxWithSigner[];
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
    provider?: AnchorProvider;
    prioritizationFee?: number;
    retryDelay?: number;
}): Promise<string[]> {
    const provider = Data.provider
        ? Data.provider
        : getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer }).provider;

    const txsWithSigners = Data.txsWithoutSigners.map((txWithSigners) => {
        txWithSigners.signers = [Data.signer];
        return txWithSigners;
    });
    // console.log('program',program);

    console.log(
        "User ",
        Data.signer.publicKey.toBase58(),
        " has found to have ",
        txsWithSigners.length,
        " transaction(s) to send \nBroadcasting to blockchain ..."
    );
    if (!Data.simulation) Data.simulation = false;

    let transactionHashs = [];

    for (let i = 0; i < txsWithSigners.length; i++) {
        let hash = await sendSingleTransaction({
            tx: txsWithSigners[i],
            connection: provider.connection,
            skipSimulation: !Data.simulation,
            commitment: "confirmed",
            retryDelay: Data.retryDelay ? Data.retryDelay : 5000,
            clusterOrUrl: Data.clusterOrUrl,
        });
        transactionHashs.push(hash);
    }
    return transactionHashs;
}
