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
import { getCNFTData } from "../../utils/getCNFTData.function";
import { encode } from "bs58";

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
    const { creatorHash, dataHash, index, merkleTree, nonce, proofMeta, root, treeAuthority } =
        await getCNFTData({ tokenId: Data.tokenId.toBase58(), Cluster: "mainnet-beta" });
    // console.log(
    //     "getDepositCNftInstruction",
    //     Data.tokenId.toBase58(),
    //     "\nmerkleTree.toBase58()",
    //     merkleTree.toBase58(),
    //     "\nindex",
    //     index,
    //     "\ncreatorHash.toString()",
    //     creatorHash.toString(),
    //     "\ndataHash.toString",
    //     dataHash.toString(),
    //     "\nnonce.toNumber()",
    //     nonce.toNumber(),
    //     "\nroot.toString()",
    //     root.toString(),
    //     "\ntreeAuthority",
    //     treeAuthority.toString()
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
                    systemProgram: SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    splTokenProgram: TOKEN_PROGRAM_ID,
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    // leafOwner: Data.signer,
                    user: Data.signer,
                    leafDelegate: Data.signer,
                    treeAuthority,
                    merkleTree,
                    logWrapper: SPL_NOOP_PROGRAM_ID,
                    compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                    bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
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
                            seed: Data.swapIdentity.swapDataAccount_seed.toString(),
                            root: encode(root),
                            dataHash: encode(dataHash),
                            creatorHash: encode(creatorHash),
                            nonce: nonce.toNumber(),
                            index: index,
                        },
                        accounts: {
                            metadataProgram: TOKEN_METADATA_PROGRAM.toBase58(),
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                            splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                            splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID.toBase58(),
                            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                            user: Data.signer.toBase58(),
                            leafDelegate: Data.signer.toBase58(),
                            treeAuthority: treeAuthority.toBase58(),
                            merkleTree: merkleTree.toBase58(),
                            logWrapper: SPL_NOOP_PROGRAM_ID.toBase58(),
                            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID.toBase58(),
                            bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID.toString(),
                        },
                        remainingAccounts: proofMeta.map((item) => item.pubkey.toBase58()),
                    },
                },
            ],
        };
    }
}
