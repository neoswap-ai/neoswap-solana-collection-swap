import {
    AccountMeta,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
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
import { SwapIdentity } from "../../utils/types";
import { decode } from "bs58";
import { getCNFTData } from "../../utils/getCNFTData.function";

export async function getClaimCNftInstruction(Data: {
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
    user: PublicKey;
    tokenId: PublicKey;
}) {
    const { creatorHash, dataHash, index, merkleTree, nonce, proofMeta, root, treeAuthority } =
        await getCNFTData({ tokenId: Data.tokenId.toBase58(), Cluster: "mainnet-beta" });
    return await Data.program.methods
        .claimCNft(
            Data.swapIdentity.swapDataAccount_seed,
            Data.swapIdentity.swapDataAccount_bump,
            root,
            dataHash,
            creatorHash,
            nonce,
            index
        )
        .accounts({
            systemProgram: SystemProgram.programId.toBase58(),
            metadataProgram: TOKEN_METADATA_PROGRAM,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: TOKEN_PROGRAM_ID,
            splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
            user: Data.user,
            signer: Data.signer,
            leafDelegate: Data.signer, // Data.swapIdentity.swapDataAccount_publicKey,
            treeAuthority,
            merkleTree,
            logWrapper: SPL_NOOP_PROGRAM_ID,
            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
            bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
        })
        .remainingAccounts(proofMeta)
        .instruction();
}
