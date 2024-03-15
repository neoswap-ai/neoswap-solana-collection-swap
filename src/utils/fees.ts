import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";

export async function addPriorityFee(
    tx: Transaction,
    prioritizationFee?: number
): Promise<Transaction> {
    let estimatedFee = prioritizationFee ? prioritizationFee : 0;
    let writableAccounts = tx.instructions
        .map((ix) => ix.keys.filter((key) => key.isWritable).map((key) => key.pubkey.toBase58()))
        .flat();

    if (estimatedFee === 0) {
        estimatedFee = await getRecentPrioritizationFeesHM(
            writableAccounts,
            "https://rpc.hellomoon.io"
        );
        if (estimatedFee < 50000) estimatedFee = 50000;
        console.log("using getPrioritizationFee from hellomoon", estimatedFee);
    } else console.log("force fees", estimatedFee);

    if (estimatedFee > 0) {
        tx = tx.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: estimatedFee,
            })
        );
    }

    return tx;
}

const getRecentPrioritizationFeesHM = async (
    writableAccounts: string[] = [],
    url: string
): Promise<number> => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getPrioritizationFee",
            params: {
                writableAccounts,
                percentiles: [0, 25, 50, 75, 90, 100],
                lookbackSlots: 100,
            },
        }),
    });
    const data = (await response.json()).result.percentileToFee;
    console.log("getPrioritizationFee:", data);
    return data["90"];
};
