import { Cluster, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendBundledTransactions } from "./sendBundledTransactions.function";
import { getProgram } from "./getProgram.obj";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "./const";

export async function closeUserPda(Data: { clusterOrUrl: Cluster | string; signer: Keypair }) {
    let program = getProgram({ clusterOrUrl: Data.clusterOrUrl ,signer:Data.signer});
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

    return await sendBundledTransactions({
        clusterOrUrl: Data.clusterOrUrl,
        signer: Data.signer,
        // ixs: [ix],
        txsWithoutSigners: [{ tx: new Transaction().add(ix) }],
        provider: program.provider as AnchorProvider,
    });
}
