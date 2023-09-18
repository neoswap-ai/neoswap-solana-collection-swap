import { Cluster, Connection } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { Program } from "@project-serum/anchor";

export async function isConfirmedTx(Data: {
    transactionHashs: string[];
    clusterOrUrl: Cluster | string;
    connection?: Connection;
}) {
    const connection = Data.connection
        ? Data.connection
        : getProgram({ clusterOrUrl: Data.clusterOrUrl }).provider.connection;
    const blockHashData = await connection.getLatestBlockhash();
    let confirmArray: {
        transactionHash: string;
        isConfirmed: boolean;
        err?: any;
    }[] = [];
    await Promise.all(
        Data.transactionHashs.map(async (transactionHash) => {
            try {
                const isConfirmed = await connection.confirmTransaction(
                    {
                        signature: transactionHash,
                        ...blockHashData,
                    },
                    "finalized"
                );
                if (isConfirmed.value.err) {
                    // return true;
                    console.log("isConfirmed.value.err", isConfirmed.value.err);

                    confirmArray.push({
                        transactionHash,
                        isConfirmed: false,
                        err: isConfirmed.value.err,
                    });
                } else {
                    confirmArray.push({
                        transactionHash,
                        isConfirmed: true,
                    });
                }
            } catch (error) {
                confirmArray.push({
                    transactionHash,
                    isConfirmed: false,
                });
            }
        })
    );
    return confirmArray;
}
