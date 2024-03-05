import { Cluster, Keypair } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ErrorFeedback, TxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";

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
