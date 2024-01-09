import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";

import { Program } from "@coral-xyz/anchor";
import { NftSwapItem, SwapIdentity, TokenSwapItem } from "../../utils/types";
import { findNftDataAndMetadataAccount } from "../../utils/findNftDataAndAccounts.function";
import { TOKEN_METADATA_PROGRAM } from "../../utils/const";
import { getCNFTData } from "../../utils/getCNFTData.function";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

export async function getInitializeModifyNftInstructions(Data: {
    program: Program;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    tradesToModify: { nftSwapItem: NftSwapItem; isMaker: boolean }[];
}) {
    let instructions: TransactionInstruction[] = [];
    await Promise.all(
        Data.tradesToModify.map(async (tradeToModify) => {
            if (tradeToModify.nftSwapItem.isCompressed) {
                const {
                    // creatorHash,
                    // dataHash,
                    // index,
                    merkleTree,
                    // nonce,
                    // proofMeta,
                    // root,
                    treeAuthority,
                } = await getCNFTData({
                    connection: Data.program.provider.connection,
                    tokenId: tradeToModify.nftSwapItem.mint.toBase58(),
                    Cluster: Data.program.provider.connection.rpcEndpoint.includes("mainnet")
                        ? "mainnet-beta"
                        : "devnet",
                });
                let user = tradeToModify.isMaker
                    ? tradeToModify.nftSwapItem.destinary.toBase58()
                    : tradeToModify.nftSwapItem.owner.toBase58();

                instructions.push(
                    await Data.program.methods
                        .initializeModifyCnft(
                            Data.swapIdentity.swapDataAccount_seed,
                            tradeToModify.nftSwapItem,
                            tradeToModify.isMaker
                        )
                        .accounts({
                            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                            signer: Data.signer.toBase58(),
                            user,
                            leafDelegate: user,
                            treeAuthority,
                            merkleTree,
                            systemProgram: SystemProgram.programId,
                            logWrapper: SPL_NOOP_PROGRAM_ID,
                            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                            bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
                        })
                        .instruction()
                );
            } else {
                const { metadataAddress: nftMetadata } = await findNftDataAndMetadataAccount({
                    connection: Data.program.provider.connection,
                    mint: tradeToModify.nftSwapItem.mint,
                });
                let user = tradeToModify.isMaker
                    ? tradeToModify.nftSwapItem.destinary.toBase58()
                    : tradeToModify.nftSwapItem.owner.toBase58();

                instructions.push(
                    await Data.program.methods
                        .initializeModifyPnft(
                            Data.swapIdentity.swapDataAccount_seed,
                            tradeToModify.nftSwapItem,
                            tradeToModify.isMaker
                        )
                        .accounts({
                            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                            signer: Data.signer.toBase58(),
                            user,
                            nftMetadata,
                            mint: tradeToModify.nftSwapItem.mint,
                            metadataProgram: TOKEN_METADATA_PROGRAM,
                        })
                        .instruction()
                );
            }
        })
    );
    if (instructions.length === 0) return;
    return instructions;
}
