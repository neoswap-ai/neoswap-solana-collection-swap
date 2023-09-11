import {
    AccountMeta,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
    clusterApiUrl,
} from "@solana/web3.js";
import {
    ConcurrentMerkleTreeAccount,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";

import { BN, Program } from "@project-serum/anchor";
import { SOLANA_SPL_ATA_PROGRAM_ID, TOKEN_METADATA_PROGRAM } from "../../utils/const";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    ApiProcessorConfigType,
    ApiProcessorData,
    DepositCNft,
    SwapIdentity,
} from "../../utils/types";

export async function getDepositCNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    tokenId: PublicKey;
    prepare?: boolean;
}): Promise<{
    instructions?: TransactionInstruction;
    prepareInstruction?: ApiProcessorConfigType[];
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
    if (!Data.prepare) {
        return {
            instructions: await Data.program.methods
                .depositCNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    root,
                    dataHash,
                    creatorHash,
                    nonce,
                    index
                )
                .accounts({
                    metadata_program: TOKEN_METADATA_PROGRAM,
                    sysvar_instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    spl_token_program: TOKEN_PROGRAM_ID,
                    spl_ata_program: SOLANA_SPL_ATA_PROGRAM_ID,
                    swap_data_account: Data.swapIdentity.swapDataAccount_publicKey,
                    user: Data.signer,
                    leaf_delegate: Data.signer,
                    tree_authority: treeAuthority,
                    merkle_tree: treeProof.tree_id,
                    log_wrapper: SPL_NOOP_PROGRAM_ID,
                    compression_program: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                    bubblegum_program: MPL_BUBBLEGUM_PROGRAM_ID,
                })
                .remainingAccounts(proofMeta)
                .instruction(),
        };
    } else {
        return {
            prepareInstruction: [
                {
                    programId: Data.program.programId.toString(),
                    type: "depositCNft",
                    data: {
                        arguments: {
                            seed: Data.swapIdentity.swapDataAccount_seedString,
                            root,
                            dataHash,
                            creatorHash,
                            nonce,
                            index,
                        },
                        accounts: {
                            metadata_program: TOKEN_METADATA_PROGRAM.toBase58(),
                            sysvar_instructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                            spl_token_program: TOKEN_PROGRAM_ID.toBase58(),
                            spl_ata_program: SOLANA_SPL_ATA_PROGRAM_ID.toBase58(),
                            swap_data_account:
                                Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                            user: Data.signer.toBase58(),
                            leaf_delegate: Data.signer.toBase58(),
                            tree_authority: treeAuthority.toBase58(),
                            merkle_tree: treeProof.tree_id.toBase58(),
                            log_wrapper: SPL_NOOP_PROGRAM_ID.toBase58(),
                            compression_program: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID.toBase58(),
                            bubblegum_program: MPL_BUBBLEGUM_PROGRAM_ID.toString(),
                        },
                    },
                },
            ],
        };
    }
}
