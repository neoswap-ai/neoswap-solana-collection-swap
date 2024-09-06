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
}: {
  BT?: BTv[];
  tx: VersionedTransaction;
  details: any;
  actions: string[];
  description: string;
}) {
  return {
    tx,
    description,
    details,
    actions,
    priority: BT != undefined ? BT.length : 0,
    status: "pending",
    blockheight: 0,
  } as BTv;
  // return BT;
}

export async function appendBtByChunk(
  txsArray: AppendToTx[],
  envOpts: EnvOpts,
  signer: string,
  maxTransactionSize: number = MAX_BYTE_PER_TRANSACTION
): Promise<BTv[]> {
  let bTxs: BTv[] = [];
  let currentChunk: TransactionInstruction[] = [];
  let currentDetails: any = {};
  let currentActions: string[] = [];
  let currentDescription: string = "";

  for (const chunk of txsArray) {
    // console.log("chunk", chunk);
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
        tx: await ix2vTx(currentChunk, envOpts, signer),
      })
    );
  }

  // change transaction after make to be Synchronous/
  bTxs.forEach((btx, i) => {
    if (i != 0) btx.priority = bTxs[0].priority + 1;
    // console.log(
    //   btx.description,
    //   "btx",
    //   btx.tx.serialize().length,
    //   btx.tx.message.staticAccountKeys.map((v) => v.toString())
    // );
  });

  return bTxs;
}
