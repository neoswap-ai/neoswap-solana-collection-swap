import { Cluster, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { sendBundledTransactions } from "./sendBundledTransactions.function";
import { SPL_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import { getProgram } from "./getProgram.obj";

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
            splTokenProgram: SPL_TOKEN_PROGRAM_ID,
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
