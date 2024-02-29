import { Cluster, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { getAdminPda } from "../../utils/findNftDataAndAccounts.function";

export async function getCreateAdminPdaIx(Data: {
    program: Program;
    signer: PublicKey;
    nbAdminMax: number;
}): Promise<TransactionInstruction> {
    let cluster: Cluster = Data.program.provider.connection.rpcEndpoint.includes("mainnet")
        ? "mainnet-beta"
        : "devnet";

    return await Data.program.methods
        .adminPdaInit(Data.nbAdminMax)
        .accounts({
            adminPda: getAdminPda(cluster),
            signer: Data.signer,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
}

export async function getModifyAdminPdaIx(Data: {
    program: Program;
    signer: PublicKey;
    adminToAdd: PublicKey;
    is_delete: boolean;
}): Promise<TransactionInstruction> {
    let cluster: Cluster = Data.program.provider.connection.rpcEndpoint.includes("mainnet")
        ? "mainnet-beta"
        : "devnet";

    return await Data.program.methods
        .adminPdaModify(Data.adminToAdd, Data.is_delete)
        .accounts({
            adminPda: getAdminPda(cluster),
            signer: Data.signer,
        })
        .instruction();
}
