import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import {
    AccountMeta,
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
    clusterApiUrl,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    ConcurrentMerkleTreeAccount,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../../utils/findNftDataAndAccounts.function";
import { BN, Program } from "@project-serum/anchor";
import { SwapIdentity } from "../../utils/types";
import { MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";

export async function getCancelNftInstructions(Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
    user: PublicKey;
    tokenId: PublicKey;
}): Promise<{
    instructions: TransactionInstruction[];
}> {
    let solanaUrl = clusterApiUrl("mainnet-beta");
    const treeDataReponse = await fetch(solanaUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAsset",
            params: {
                id: Data.tokenId.toString(),
            },
        }),
    });
    let treeData = (await treeDataReponse.json()).result;
    console.log("treeData Results", treeData);

    const treeProofResponse = await fetch(solanaUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAssetProof",
            params: {
                id: Data.tokenId.toString(),
            },
        }),
    });
    let treeProof = (await treeProofResponse.json()).result;

    console.log("treeProof Results", treeProof);

    // retrieve the merkle tree's account from the blockchain
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
        Data.program.provider.connection,
        new PublicKey(treeProof.tree_id)
    );
    console.log("treeAccount", treeAccount);

    // extract the needed values for our transfer instruction
    const treeAuthority = treeAccount.getAuthority();
    const canopyDepth = treeAccount.getCanopyDepth();

    // console.log("treeAuthority", treeAuthority);
    // console.log("canopyDepth", canopyDepth);

    const proofMeta: AccountMeta[] = treeProof.proof
        .slice(0, treeProof.proof.length - (!!canopyDepth ? canopyDepth : 0))
        .map((node: string) => ({
            pubkey: new PublicKey(node),
            isSigner: false,
            isWritable: false,
        }));
    console.log("proofMeta", proofMeta);
    // const proof = proofMeta.map((node: AccountMeta) => node.pubkey.toString());
    // console.log('proof', proof);

    // console.log('treeProof.root', treeProof.root);
    // console.log('treeData.data_hash', treeProof);
    // console.log('treeData.creator_hash', treeData.compression);

    let instructions = [];
    let root = new PublicKey(treeProof.root).toBytes();
    let dataHash = new PublicKey(treeData.compression.data_hash).toBytes();
    let creatorHash = new PublicKey(treeData.compression.creator_hash).toBytes();
    let nonce = new BN(treeData.compression.leaf_id);
    let index = new BN(treeData.compression.leaf_id);

    // console.log('nonce', nonce);
    // console.log("args", root, dataHash, creatorHash, nonce, index);
    // console.log(
    //     "accounts",
    //     "\nleafOwner:",
    //     Data.signer,
    //     "\nleafDelegate: ",
    //     Data.signer,
    //     "\ntreeAuthority",
    //     treeAuthority,
    //     " \nmerkleTree:",
    //     treeProof.tree_id,
    //     " \nnewLeafOwner:",
    //     Data.destinary,
    //     "\nlogWrapper:",
    //     SPL_NOOP_PROGRAM_ID,
    //     "\ncompressionProgram:",
    //     SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    //     "\nbubblegumProgram:",
    //     MPL_BUBBLEGUM_PROGRAM_ID,

    //     "\nsystemProgram:",
    //     SystemProgram.programId.toBase58(),
    //     " \nanchorRemainingAccounts:",
    //     proofMeta
    // );
    instructions.push(
        await Data.program.methods
            .cancelCNft(root, dataHash, creatorHash, nonce, index)
            .accounts({
                leafDelegate: Data.signer,
                treeAuthority,
                merkleTree: treeProof.tree_id,
                logWrapper: SPL_NOOP_PROGRAM_ID,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,

                systemProgram: SystemProgram.programId.toBase58(),
                // remainingAccounts: proof,
                metadataProgram: TOKEN_METADATA_PROGRAM,
                sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                splTokenProgram: TOKEN_PROGRAM_ID,
                splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                swapDataAccount: Data.swapDataAccount,
                user: Data.user,
                signer: Data.signer,

                newLeafOwner: Data.user,
            })
            .remainingAccounts(proofMeta)
            .instruction()
    );

    return { instructions };
}
