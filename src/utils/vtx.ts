import {
    BlockhashWithExpiryBlockHeight,
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { addPriorityFee } from "./fees";
import {  EnvOpts } from "./types";
import { checkEnvOpts } from "./check";

export async function ix2vTx(ix: TransactionInstruction[], envOpts: EnvOpts, signer: string) {
    let cEnvOpts = checkEnvOpts(envOpts);
    let { connection, prioritizationFee } = cEnvOpts;
    let ttx = new Transaction().add(...ix);
    ttx.feePayer = new PublicKey(signer);
    ttx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    ttx = await addPriorityFee(ttx, prioritizationFee);
    return new VersionedTransaction(ttx.compileMessage());
}
