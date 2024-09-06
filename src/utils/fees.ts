import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Bid } from "./types";

export async function addPriorityFee(
  tx: Transaction,
  prioritizationFee?: number
): Promise<Transaction> {
  let estimatedFee = prioritizationFee ? prioritizationFee : 0;
  let writableAccounts = tx.instructions
    .map((ix) => ix.keys.filter((key) => key.isWritable).map((key) => key.pubkey.toBase58()))
    .flat();

  if (!prioritizationFee) {
    estimatedFee = await getRecentPrioritizationFeesHM(
      writableAccounts,
      "https://rpc.hellomoon.io/13bb514b-0e38-4ff2-a167-6383ef88aa10"
    );
    if (estimatedFee < 10000) estimatedFee = 10000;
    console.log("using getPrioritizationFee from hellomoon", estimatedFee);
    if (estimatedFee > 0) {
      tx = tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: estimatedFee,
        })
      );
    }
  } else console.log("force fees", estimatedFee);

  return tx;
}

export async function addPrioFeeIx(
  ixs: TransactionInstruction[],
  prioritizationFee?: number,
  skipVerbose?: boolean
) {
  let estimatedFee = prioritizationFee ? prioritizationFee : 0;
  let accs = ixs.flatMap((ix) => ix.keys.flatMap((acc) => acc.pubkey.toString()));

  if (prioritizationFee! >= 0) {
    console.log("force fees", estimatedFee);
  } else {
    estimatedFee = await getRecentPrioritizationFeesHM(
      accs,
      "https://rpc.hellomoon.io/13bb514b-0e38-4ff2-a167-6383ef88aa10",
      skipVerbose
    );
    if (estimatedFee < 10000) estimatedFee = 10000;
    if (!skipVerbose) console.log("using getPrioritizationFee from hellomoon", estimatedFee);
  }

  if (estimatedFee > 0) {
    return [
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: estimatedFee,
      }),
      ...ixs,
    ];
  } else return ixs;
}

export async function addPriorityFeeIx(
  tx: Transaction,
  prioritizationFee?: number
): Promise<TransactionInstruction[]> {
  return (await addPriorityFee(tx, prioritizationFee)).instructions;
}

const getRecentPrioritizationFeesHM = async (
  writableAccounts: string[] = [],
  url: string,
  skipVerbose?: boolean
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
  let jsonData = await response.json();
  // console.log("getPrioritizationFee:", jsonData);

  const data = jsonData.result.percentileToFee;
  if (!skipVerbose) console.log("getPrioritizationFee:", data);
  return data["90"];
};

export function calculateMakerFee({ bids }: { bids: Bid[] }) {
  let maxAmount = 0;
  bids.map((bid) => {
    let amount = makerFee({ bid });
    maxAmount = Math.max(maxAmount, amount);
  });
  if (maxAmount <= 0) {
    console.log(
      "Maker will receive funds, no fees to deposit " +
        maxAmount +
        " ( " +
        maxAmount / LAMPORTS_PER_SOL +
        " ) lamports"
    );
    return maxAmount;
  }
  console.log(
    "Wrapping " + maxAmount + " ( " + maxAmount / LAMPORTS_PER_SOL + " ) lamports to wSOL"
  );
  return maxAmount;
}

export function makerFee({ bid }: { bid: Bid }) {
  return -bid.amount + bid.makerNeoswapFee + bid.makerRoyalties;
}
export function takerFee({ bid, n }: { bid: Bid; n: number }): number {
  let takerAmount: number;
  if (n === 42) {
    console.log("fees waived");
    takerAmount = bid.amount;
  } else takerAmount = bid.amount + bid.takerNeoswapFee + bid.takerRoyalties;

  if (takerAmount <= 0) {
    console.log(
      "Taker will receive funds, no fees to deposit " +
        takerAmount +
        " ( " +
        takerAmount / LAMPORTS_PER_SOL +
        " ) lamports"
    );
  } else {
    console.log(
      "Wrapping " + takerAmount + " ( " + takerAmount / LAMPORTS_PER_SOL + " ) lamports to wSOL"
    );
  }
  return takerAmount;
}
