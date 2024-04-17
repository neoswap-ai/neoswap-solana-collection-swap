import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { checkEnvOpts } from "../utils/check";
import { BTv, BundleTransaction, EnvOpts, SetNewTime } from "../utils/types";
import BN from "bn.js";
import { DESC } from "../utils/descriptions";

export async function createSetNewTime(Data: EnvOpts & SetNewTime): Promise<BundleTransaction> {
    let { swapDataAccount, maker, newTime } = Data;
    let cEnvOpts = await checkEnvOpts(Data);
    let { program, connection } = cEnvOpts;
    let tx = new Transaction().add(
        await program.methods
            .overrideTime(new BN(newTime))
            .accounts({
                swapDataAccount,
                maker,
            })
            .instruction()
    );
    tx.feePayer = new PublicKey(maker);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    return {
        tx: new VersionedTransaction(tx.compileMessage()),
        description: DESC.setTime,
        details: { swapDataAccount, maker, newTime } as SetNewTime,
        priority: 0,
        status: "pending",
    } as BTv;
}
