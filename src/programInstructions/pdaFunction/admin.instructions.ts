import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAdminPda } from "../../utils/getPda";

export async function createAdminInitIx(Data: { program: Program; signer: PublicKey; nb: number }) {
    return await Data.program.methods
        .adminPdaInit(Data.nb)
        .accounts({
            adminPda: getAdminPda({ programId: Data.program.programId }),
            signer: Data.signer,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
}

export async function createAdminModIx(Data: {
    program: Program;
    signer: PublicKey;
    adminToAdd: PublicKey;
    is_delete?: boolean;
}) {
    return await Data.program.methods
        .adminPdaModify(Data.adminToAdd, Data.is_delete ? Data.is_delete : false)
        .accounts({
            adminPda: getAdminPda({ programId: Data.program.programId }),
            signer: Data.signer,
        })
        .instruction();
}
