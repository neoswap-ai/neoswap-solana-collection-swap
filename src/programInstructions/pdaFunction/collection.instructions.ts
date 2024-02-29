import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAdminPda, getCollectionPda } from "../../utils/getPda";

export async function createCollectionInitIx(Data: {
    program: Program;
    signer: PublicKey;
    nb: number;
    collection: PublicKey;
}) {
    return await Data.program.methods
        .collectionPdaInit(Data.nb, Data.collection)
        .accounts({
            adminPda: getAdminPda({ programId: Data.program.programId }),
            collectionPda: getCollectionPda({
                collection: Data.collection,
                programId: Data.program.programId,
            }),
            signer: Data.signer,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
}

export async function createCollectionModIx(Data: {
    program: Program;
    signer: PublicKey;
    collection: PublicKey;
    merkleToAdd: PublicKey;
    is_delete: boolean;
}) {
    return await Data.program.methods
        .collectionPdaModify(Data.merkleToAdd, Data.is_delete)
        .accounts({
            adminPda: getAdminPda({ programId: Data.program.programId }),
            collectionPda: getCollectionPda({
                collection: Data.collection,
                programId: Data.program.programId,
            }),
            signer: Data.signer,
        })
        .instruction();
}
