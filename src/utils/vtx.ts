import {
  BlockhashWithExpiryBlockHeight,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { addPriorityFee } from "./fees";
import { BTv, BundleTransaction, EnvOpts } from "./types";
import { checkEnvOpts } from "./check";
import { createVTxWithLookupTable } from "./addressLookupTable";

export async function ix2vTx(
  ix: TransactionInstruction[],
  envOpts: EnvOpts,
  signer: string,
  computeUnits?: number
) {
  let cEnvOpts = await checkEnvOpts(envOpts);

  let { connection, prioritizationFee, lookUpTableAccount } = cEnvOpts;
  ix = [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits ?? 8_500_000,
    }),
    ...ix,
  ];
  // ix.push(addPriorityFeeIx())
  // console.log("ix2vTx", lookUpTableAccount);
  return await createVTxWithLookupTable({
    connection,
    instructions: ix,
    lookUpTableAccount,
    payer: signer,
    prioritizationFee,
  });
}

export function appendToBT({
  BT,
  description,
  details,
  tx,
}: {
  BT?: BTv[];
  tx: VersionedTransaction;
  details: any;
  description: string;
}) {
  return {
    tx,
    description,
    details,
    priority: BT != undefined ? BT.length : 0,
    status: "pending",
    blockheight: 0,
  } as BTv;
  // return BT;
}
