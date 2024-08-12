import {
    BlockhashWithExpiryBlockHeight,
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { addPriorityFee } from "./fees";
import { EnvOpts } from "./types";
import { checkEnvOpts } from "./check";
import { createVTxWithLookupTable } from "./addressLookupTable";

export async function ix2vTx(ix: TransactionInstruction[], envOpts: EnvOpts, signer: string) {
    let cEnvOpts = await checkEnvOpts(envOpts);

    let { connection, prioritizationFee, lookUpTableAccount } = cEnvOpts;
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
