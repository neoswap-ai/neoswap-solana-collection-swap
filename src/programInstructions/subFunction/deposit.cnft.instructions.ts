import {
    Cluster,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";

import { Program } from "@coral-xyz/anchor";
import { SOLANA_SPL_ATA_PROGRAM_ID, TOKEN_METADATA_PROGRAM } from "../../utils/const";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ApiProcessorConfigType, SwapIdentity } from "../../utils/types";
import { getCNFTData } from "../../utils/getCNFTData.function";
import { encode } from "bs58";

export async function getDepositCNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    tokenId: PublicKey;
    clusterOrUrl: Cluster | string;
    prepare?: boolean;
}): Promise<{
    instructions?: TransactionInstruction;
    prepareInstruction?: ApiProcessorConfigType[];
}> {
    const { creatorHash, dataHash, index, merkleTree, nonce, proofMeta, root, treeAuthority } =
        await getCNFTData({
            connection: Data.program.provider.connection,
            tokenId: Data.tokenId.toBase58(),
            Cluster: Data.clusterOrUrl.includes("mainnet") ? "mainnet-beta" : "devnet",
        });
    console.log(
        "getDepositCNftInstruction",
        Data.tokenId.toBase58(),
        "\nmerkleTree.toBase58()",
        merkleTree.toBase58(),
        "\nindex",
        index,
        "\ncreatorHash.toString()",
        creatorHash.toString(),
        "\ndataHash.toString",
        dataHash.toString(),
        "\nnonce.toNumber()",
        nonce.toNumber(),
        "\nroot.toString()",
        root.toString(),
        "\ntreeAuthority",
        treeAuthority.toString(),
        '\nsystemProgram:', SystemProgram.programId.toBase58(),
        '\nmetadataProgram:', TOKEN_METADATA_PROGRAM.toBase58(),
        '\nsysvarInstructions:', SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
        '\ntokenProgram:', TOKEN_PROGRAM_ID.toBase58(),
        '\nsplAtaProgram:', SOLANA_SPL_ATA_PROGRAM_ID.toBase58(),
        '\nswapDataAccount:', Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
        // 'leafOwner:', Data.signer.toBase58(),
        '\nuser:', Data.signer.toBase58(),
        '\nleafDelegate:', Data.signer.toBase58(),
        '\ntreeAuthority',treeAuthority.toBase58(),
        '\nmerkleTree',merkleTree.toBase58(),
        '\nlogWrapper:', SPL_NOOP_PROGRAM_ID.toBase58(),
        '\ncompressionProgram:', SPL_ACCOUNT_COMPRESSION_PROGRAM_ID.toBase58(),
        '\nbubblegumProgram:', MPL_BUBBLEGUM_PROGRAM_ID.toBase58(),
    );

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
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    // leafOwner: Data.signer,
                    user: Data.signer,
                    leafDelegate: Data.signer,
                    treeAuthority,
                    merkleTree,
                    systemProgram: SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
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
                            seed: (Data.swapIdentity.swapDataAccount_seed).toString(),
                            root: encode(root),
                            dataHash: encode(dataHash),
                            creatorHash: encode(creatorHash),
                            nonce: nonce.toNumber(),
                            index: index,
                        },
                        accounts: {
                            metadataProgram: TOKEN_METADATA_PROGRAM.toBase58(),
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                            tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
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
