import { Cluster, Keypair, Transaction } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ErrorFeedback } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { AnchorProvider } from "@coral-xyz/anchor";

export async function sendSingleTransaction(Data: {
    tx: Transaction;
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
    provider?: AnchorProvider;
}): Promise<string> {
    if (!Data.skipSimulation) Data.skipSimulation = false;

    const provider = Data.provider
        ? Data.provider
        : getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer }).provider;

    console.log(
        "User ",
        Data.signer.publicKey.toBase58(),
        " has found a transaction to send \nBroadcasting to blockchain ..."
    );

    if (!provider.sendAndConfirm) throw { message: "your provider is not an AnchorProvider type" };

    let hash = await provider.sendAndConfirm(Data.tx, [Data.signer], {
        skipPreflight: Data.skipSimulation,
    });

    if (!Data.skipConfirmation) {
        const confirmArray = await isConfirmedTx({
            clusterOrUrl: Data.clusterOrUrl,
            transactionHashs: [hash],
            connection: provider.connection,
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
