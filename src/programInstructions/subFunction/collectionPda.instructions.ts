import { Cluster, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { getAdminPda, getCollectionPda } from "../../utils/findNftDataAndAccounts.function";

export async function getCreateCollectionPdaIx(Data: {
    program: Program;
    signer: PublicKey;
    collection: PublicKey;
    nbMerkleMax: number;
}): Promise<TransactionInstruction> {
    let cluster: Cluster = Data.program.provider.connection.rpcEndpoint.includes("mainnet")
        ? "mainnet-beta"
        : "devnet";
    let programId = Data.program.programId;
    return await Data.program.methods
        .collectionPdaInit(Data.nbMerkleMax, Data.collection)
        .accounts({
            adminPda: getAdminPda(cluster, programId),
            collectionPda: getCollectionPda({ cluster, collection: Data.collection, programId }),
            signer: Data.signer,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
}

export async function getModifyCollectionPdaIx(Data: {
    program: Program;
    signer: PublicKey;
    collection: PublicKey;
    merkle_tree: PublicKey;
    is_delete: boolean;
}): Promise<TransactionInstruction> {
    let cluster: Cluster = Data.program.provider.connection.rpcEndpoint.includes("mainnet")
        ? "mainnet-beta"
        : "devnet";

    return await Data.program.methods
        .adminPdaModify(Data.merkle_tree, Data.is_delete)
        .accounts({
            adminPda: getAdminPda(cluster),
            collectionPda: getCollectionPda({
                cluster,
                collection: Data.collection,
                programId: Data.program.programId,
            }),
            signer: Data.signer,
        })
        .instruction();
}
