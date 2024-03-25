import { isVersionedTransaction } from "@solana/wallet-adapter-base";
import { BundleTransaction, OptionSend, EnvOpts } from "./types";
import { checkEnvOpts, checkOptionSend } from "./check";

export async function refreshBTBlockhash(
    bts: BundleTransaction[],
    envOpts: EnvOpts
): Promise<BundleTransaction[]> {
    let { connection } = checkEnvOpts(envOpts);
    let recentBch = (await connection.getLatestBlockhash()).blockhash;
    bts.forEach((bt) => {
        if (isVersionedTransaction(bt.tx)) bt.tx.message.recentBlockhash = recentBch;
        else bt.tx.recentBlockhash = recentBch;
    });
    return bts;
}
