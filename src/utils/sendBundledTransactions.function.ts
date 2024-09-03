import { Keypair } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { BundleTransaction, COptionSend, ErrorFeedback, OptionSend, TxWithSigner } from "./types";
import { isConfirmedTx } from "./isConfirmedTx.function";
import { sendSingleBundleTransaction } from "./sendSingleTransaction.function";
import { checkOptionSend } from "./check";
import { addPriorityFee } from "./fees";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";
import { delay } from "./delay";

export async function sendBundledTransactions(
  Data: COptionSend & {
    txsWithoutSigners: TxWithSigner[];
    signer: Keypair;
  }
): Promise<string[]> {
  let cOptionSend = checkOptionSend(Data);
  let { clusterOrUrl, skipSimulation, connection } = cOptionSend;
  let { txsWithoutSigners, signer, skipConfirmation } = Data;
  try {
    const provider = (
      await getProgram({
        clusterOrUrl,
        signer,
      })
    ).provider;

    const txsWithSigners = txsWithoutSigners.map((txWithSigners) => {
      txWithSigners.signers = [signer];
      return txWithSigners;
    });

    console.log(
      "User ",
      signer.publicKey.toBase58(),
      " has found to have ",
      txsWithoutSigners.length,
      " transaction(s) to send \nBroadcasting to blockchain ..."
    );
    if (!provider.sendAll) throw { message: "your provider is not an AnchorProvider type" };

    let transactionHashs = await provider.sendAll(txsWithSigners, {
      maxRetries: 5,
      skipPreflight: skipSimulation,
    });

    if (!skipConfirmation) {
      const confirmArray = await isConfirmedTx({
        clusterOrUrl,
        transactionHashs,
        connection,
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

export async function sendBundledTransactionsV2(
  Data: OptionSend & {
    bundleTransactions: BundleTransaction[];
    signer?: Keypair;
  }
): Promise<BundleTransaction[]> {
  let cOptionSend = checkOptionSend(Data);
  let { prioritizationFee, connection } = cOptionSend;

  let { bundleTransactions, signer } = Data;

  let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  if (!signer)
    bundleTransactions.map((tx) => {
      tx.stx!.signatures.forEach((sig, i) => {
        if (sig.toLocaleString().length === 0)
          throw {
            blockchain: "solana",
            status: "error",
            message: `signer is required for unsigned Tx`,
          } as ErrorFeedback;
      });
    });
  else {
    let tempSigner = signer;
    bundleTransactions.forEach(async (BT) => {
      if (isVersionedTransaction(BT.tx)) {
        if (prioritizationFee)
          console.warn("prioritizationFee is not supported for VersionedTransaction");
        BT.tx.message.recentBlockhash = recentBlockhash;
        BT.stx = BT.tx;
        BT.stx.sign([tempSigner]);
      } else {
        if (prioritizationFee) BT.tx = await addPriorityFee(BT.tx, prioritizationFee);

        BT.tx.feePayer = tempSigner.publicKey;
        BT.tx.recentBlockhash = recentBlockhash;
        BT.stx = BT.tx;
        BT.stx.sign(tempSigner);
      }
    });
  }
  console.log(
    "User ",
    signer ? signer.publicKey.toBase58() : "- unknown signer -",
    " has found to have ",
    bundleTransactions.length,
    ` transaction(s) to send \nBroadcasting to blockchain ...`
  );

  let processedBTs = [];
  try {
    for (let i = 0; i < bundleTransactions.length; i++) {
      let bt = await sendSingleBundleTransaction({
        bt: bundleTransactions[i],
        ...cOptionSend,
      });
      processedBTs.push(bt);
      await isConfirmedTx({ transactionHashs: [bt.hash!], connection });
    }
    return processedBTs;
  } catch (error) {
    console.log("bundleTransactions", bundleTransactions);
    console.log("processedBTs", processedBTs);
    throw { error, processedBTs, bundleTransactions };
  }
}

export async function sendBundledTransactionsV3(
  Data: OptionSend & {
    bundleTransactions: BundleTransaction[];
    signer?: Keypair;
  }
): Promise<BundleTransaction[]> {
  let cOptionSend = checkOptionSend(Data);
  let { prioritizationFee, connection } = cOptionSend;

  let { bundleTransactions, signer } = Data;

  let recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  if (!signer)
    bundleTransactions.map((tx) => {
      tx.stx!.signatures.forEach((sig, i) => {
        if (sig.toLocaleString().length === 0)
          throw {
            blockchain: "solana",
            status: "error",
            message: `signer is required for unsigned Tx`,
          } as ErrorFeedback;
      });
    });
  else {
    let tempSigner = signer;
    bundleTransactions.forEach(async (BT) => {
      if (isVersionedTransaction(BT.tx)) {
        if (prioritizationFee)
          console.warn("prioritizationFee is not supported for VersionedTransaction");
        BT.tx.message.recentBlockhash = recentBlockhash;
        BT.stx = BT.tx;
        BT.stx.sign([tempSigner]);
      } else {
        if (prioritizationFee) BT.tx = await addPriorityFee(BT.tx, prioritizationFee);

        BT.tx.feePayer = tempSigner.publicKey;
        BT.tx.recentBlockhash = recentBlockhash;
        BT.stx = BT.tx;
        BT.stx.sign(tempSigner);
      }
    });
  }
  console.log(
    "User ",
    signer ? signer.publicKey.toBase58() : "- unknown signer -",
    " has found to have ",
    bundleTransactions.length,
    ` transaction(s) to send \nBroadcasting to blockchain ...`
  );
  let toSend: { bts: BundleTransaction[]; priority: number }[] = [];
  bundleTransactions.forEach((bt) => {
    let ind = toSend.findIndex((t) => t.priority == bt.priority);
    if (ind == -1) toSend.push({ bts: [bt], priority: bt.priority! });
    else toSend[ind].bts.push(bt);
  });
  let processedBTs = [];
  console.log("toSend", toSend);

  try {
    for (let txsToSend of toSend) {
      let bts = await Promise.all(
        txsToSend.bts.map(async (txSend, i) => {
          await delay(i * 100);
          return await sendSingleBundleTransaction({
            bt: txSend,
            ...cOptionSend,
          });
        })
      );

      processedBTs.push(bts);
      await isConfirmedTx({ transactionHashs: bts.map((bt) => bt.hash!), connection });
    }
    return processedBTs.flat();
  } catch (error) {
    console.log("bundleTransactions", bundleTransactions);
    console.log("processedBTs", processedBTs);
    throw { error, processedBTs, bundleTransactions };
  }
}
