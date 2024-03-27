import {
    Cluster,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    VersionedTransaction,
} from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendBundledTransactions } from "./sendBundledTransactions.function";
import { getProgram } from "./getProgram.obj";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "./const";
import { OptionSend } from "./types";
import { checkOptionSend } from "./check";

export async function closeUserPda(Data: OptionSend & { signer: Keypair }) {
    let cOptionSend = checkOptionSend(Data);
    let { clusterOrUrl } = cOptionSend;
    let program = getProgram({ clusterOrUrl, signer: Data.signer });
    const [userPda, userBump] = PublicKey.findProgramAddressSync(
        [Data.signer.publicKey.toBuffer()],
        program.programId
    );

    let ix = await program.methods
        .userPdaClose()
        .accounts({
            userPda,
            signer: Data.signer.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: SOLANA_SPL_ATA_PROGRAM_ID,
        })
        .instruction();
    let tx = new Transaction().add(ix);
    tx.feePayer = Data.signer.publicKey;
    tx.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
    return await sendBundledTransactions({
        signer: Data.signer,
        txsWithoutSigners: [{ tx: new VersionedTransaction(tx.compileMessage()) }],
        ...cOptionSend,
    });
}
