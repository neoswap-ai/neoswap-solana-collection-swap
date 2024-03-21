import { Cluster, Connection, Finality, Keypair, VersionedTransaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { COptionSend, ErrorFeedback, OptionSend, TxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "./sendSingleTransaction.function";
import { checkOptionSend } from "./check";

export async function sendBundledTransactions(
    Data: COptionSend & {
        txsWithoutSigners: TxWithSigner[];
        signer: Keypair;
    }
): Promise<string[]> {
    let { clusterOrUrl, skipSimulation } = checkOptionSend(Data);
    try {
        const provider = getProgram({
            clusterOrUrl,
            signer: Data.signer,
        }).provider;

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

        let transactionHashs = await provider.sendAll(txsWithSigners, {
            maxRetries: 5,
            skipPreflight: skipSimulation,
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
