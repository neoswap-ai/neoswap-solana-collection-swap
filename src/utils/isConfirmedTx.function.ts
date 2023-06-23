import { Cluster } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";

export async function isConfirmedTx(Data: {
    transactionHashs: string[];
    cluster: Cluster | string;
}) {
    let program = getProgram(Data.cluster);
    const blockHashData = await program.provider.connection.getLatestBlockhash();
    let confirmArray: {
        transactionHash: string;
        isConfirmed: boolean;
    }[] = [];
    await Promise.all(
        Data.transactionHashs.map(async (transactionHash) => {
            try {
                const isConfirmed = await program.provider.connection.confirmTransaction({
                    signature: transactionHash,
                    ...blockHashData,
                });
                if (isConfirmed.value.err) {
                    // return true;
                    confirmArray.push({
                        transactionHash,
                        isConfirmed: false,
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
