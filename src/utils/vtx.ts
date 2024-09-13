import {
  ComputeBudgetProgram,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { BTv, EnvOpts } from "./types";
import { checkEnvOpts } from "./check";
import { createVTxWithLookupTable } from "./addressLookupTable";
import { MAX_BYTE_PER_TRANSACTION } from "./const";
import { AppendToTx } from "./types";

export async function ix2vTx(
  ix: TransactionInstruction[],
  envOpts: EnvOpts,
  signer: string,
  computeUnits?: number,
  skipVerbose?: boolean
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
    skipVerbose,
  });
}

export function appendToBT({
  BT,
  description,
  details,
  tx,
  actions,
  priority,
}: {
  BT?: BTv[];
  tx: VersionedTransaction;
  details: any;
  actions: string[];
  description: string;
  priority?: number;
}) {
  return {
    tx,
    description,
    details,
    actions,
    priority: priority ?? (BT != undefined ? BT.length : 0),
    status: "pending",
    blockheight: 0,
  } as BTv;
  // return BT;
}

export async function appendBtByChunk(
  txsArray: AppendToTx[],
  envOpts: EnvOpts,
  signer: string,
  reWritePriority?: boolean,
  maxTransactionSize: number = MAX_BYTE_PER_TRANSACTION
): Promise<BTv[]> {
  let bTxs: BTv[] = [];
  let currentChunk: TransactionInstruction[] = [];
  let currentDetails: any = {};
  let currentActions: string[] = [];
  let currentDescription: string = "";

  for (const chunk of txsArray) {
    const tempChunk = [...currentChunk, ...chunk.ixs];
    const vTx = await ix2vTx(tempChunk, envOpts, signer, undefined, true);
    let clumpLength = 0;
    try {
      clumpLength = vTx.serialize().length;
    } catch (error) {
      if (String(error).includes("encoding overruns Uint8Array")) {
        console.log("Tx Too big");
      } else {
        console.log("error serializing", error);
      }
    }

    console.log("clumpLength", clumpLength, " of ", currentDescription, " and ", chunk.description);

    if (clumpLength <= maxTransactionSize && clumpLength > 0) {
      console.log("clumping");

      currentChunk = tempChunk;
      currentDetails = { ...currentDetails, ...chunk.details };
      currentActions = [...currentActions, ...chunk.actions];
      if (!currentDescription.includes(chunk.description))
        currentDescription =
          currentDescription.split("...")[0] +
          (currentDescription.length === 0 ? "" : " and ") +
          chunk.description;
    } else {
      if (currentChunk.length > 0) {
        console.log("not clumping");
        bTxs.push(
          appendToBT({
            BT: bTxs,
            description: currentDescription,
            actions: currentActions,
            details: currentDetails,
            tx: await ix2vTx(currentChunk, envOpts, signer),
          })
        );
      }

      currentChunk = chunk.ixs;
      currentDetails = chunk.details;
      currentDescription = chunk.description;
      currentActions = chunk.actions;
    }
  }

  if (currentChunk.length > 0) {
    bTxs.push(
      appendToBT({
        BT: bTxs,
        description: currentDescription,
        actions: currentActions,
        details: currentDetails,
        // priority: currentPriority,
        tx: await ix2vTx(currentChunk, envOpts, signer),
      })
    );
  }

  // change transaction after make to be Synchronous/
  if (reWritePriority) {
    let forcePriority = 0;
    bTxs.forEach((btx, i) => {
      console.log("btx.description", btx.description);
      console.log("btx.actions", btx.actions);

      if (btx.actions.includes("claimSwap") || btx.actions.includes("makeSwap")) {
        forcePriority++;
        btx.priority = forcePriority;
        forcePriority++;
      } else if (btx.actions.includes("takeSwap")) {
        btx.priority = forcePriority;
        forcePriority++;
      } else btx.priority = forcePriority;
      console.log("btx.priority", btx.priority);
    });
  }

  return bTxs;
}
