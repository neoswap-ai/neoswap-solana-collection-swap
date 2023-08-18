import { Cluster, Keypair } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ErrorFeedback, TxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";

// const getProgram  from "./getProgram.obj");

export async function sendBundledTransactions(Data: {
    txsWithoutSigners: TxWithSigner[];
    signer: Keypair;
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    try {
        // console.log(txWithSigners);

        let provider = getProgram({
            clusterOrUrl: Data.clusterOrUrl,
            signer: Data.signer,
        }).provider;
        console.log();

        const txsWithSigners = Data.txsWithoutSigners.map((txWithSigners) => {
            txWithSigners.signers = [Data.signer];
            txWithSigners.tx.feePayer = Data.signer.publicKey;
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
        if (!provider.sendAll) throw { message: "your provider is not an AnchorProvider type" };
        if (!Data.simulation) Data.simulation = false;
        const transactionHashs = await provider.sendAll(txsWithSigners, {
            maxRetries: 5,
            skipPreflight: !Data.simulation,
        });

        if (!Data.skipConfirmation) {
            const confirmArray = await isConfirmedTx({
                clusterOrUrl: Data.clusterOrUrl,
                transactionHashs,
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
        // console.log("transactionHashs: ", transactionHashs);

        return transactionHashs;
    } catch (error) {
        throw error;
    }
}
