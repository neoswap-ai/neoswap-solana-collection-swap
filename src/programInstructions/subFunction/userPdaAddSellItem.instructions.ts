import { BN, Program, web3 } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    ComputeBudgetProgram,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    TransactionInstruction,
} from "@solana/web3.js";
import { ItemToSell } from "../../utils/types";
import { getCNFTData } from "../../utils/getCNFTData.function";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../../utils/findNftDataAndAccounts.function";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const getUserPdaSellItemIx = async (Data: {
    signer: PublicKey;
    program: Program;
    itemsToSell: ItemToSell[];
    is_removeItem: boolean;
}): Promise<TransactionInstruction[][]> => {
    const userSeeds = [Data.signer.toBytes()];
    const [userPda, userBump] = PublicKey.findProgramAddressSync(userSeeds, Data.program.programId);
    let instructions: TransactionInstruction[][] = [];
    await Promise.all(
        Data.itemsToSell.map(async (itemToSell) => {
            const balance = await Data.program.provider.connection.getBalance(itemToSell.mint);

            if (balance === 0) {
                // CNFT
                const {
                    creatorHash,
                    dataHash,
                    index,
                    merkleTree,
                    nonce,
                    proofMeta,
                    root,
                    treeAuthority,
                } = await getCNFTData({
                    connection: Data.program.provider.connection,
                    tokenId: itemToSell.mint.toBase58(),
                    Cluster: Data.program.provider.connection.rpcEndpoint.includes("mainnet")
                        ? "mainnet-beta"
                        : "devnet",
                });
                instructions.push([
                    await Data.program.methods
                        .userModifyCNftSell(
                            itemToSell,
                            Data.is_removeItem,

                            root,
                            dataHash,
                            creatorHash,
                            nonce,
                            index,

                            userSeeds,
                            userBump
                        )
                        .accounts({
                            userPda,
                            user: Data.signer,
                            leafDelegate: Data.signer,
                            treeAuthority,
                            merkleTree,

                            systemProgram: SystemProgram.programId,
                            metadataProgram: TOKEN_METADATA_PROGRAM,
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                            splTokenProgram: TOKEN_PROGRAM_ID,
                            splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                            logWrapper: SPL_NOOP_PROGRAM_ID,
                            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                            bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
                        })
                        .remainingAccounts(proofMeta)
                        .instruction(),
                ]);
            } else {
                // PNFT
                let subInstructions: TransactionInstruction[] = [];

                subInstructions.push(
                    ComputeBudgetProgram.setComputeUnitLimit({
                        units: 600000,
                    })
                );
                subInstructions.push(
                    ComputeBudgetProgram.setComputeUnitPrice({
                        microLamports: 1,
                    })
                );

                const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
                    connection: Data.program.provider.connection,
                    owner: Data.signer,
                    mint: itemToSell.mint,
                    signer: Data.signer,
                });
                if (userAtaIx) {
                    subInstructions.push(userAtaIx);
                    console.log("createUserAta DepositNft Tx Added", userAta.toBase58());
                }

                const { mintAta: userPdaAta, instruction: userPdaAtaIx } = await findOrCreateAta({
                    connection: Data.program.provider.connection,
                    owner: userPda,
                    mint: itemToSell.mint,
                    signer: Data.signer,
                });
                if (userPdaAtaIx) {
                    subInstructions.push(userPdaAtaIx);
                    console.log("createuserPdaAta DepositNft Tx Added", userPdaAta.toBase58());
                }

                const { tokenStandard, metadataAddress: nftMetadata } =
                    await findNftDataAndMetadataAccount({
                        connection: Data.program.provider.connection,
                        mint: itemToSell.mint,
                    });
                let nftMasterEdition = Data.signer;
                let ownerTokenRecord = Data.signer;
                let destinationTokenRecord = Data.signer;
                let authRules = Data.signer;
                if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
                    ///if New metaplex standard
                    nftMasterEdition = findNftMasterEdition({
                        mint: itemToSell.mint,
                    });

                    ownerTokenRecord = findUserTokenRecord({
                        mint: itemToSell.mint,
                        userMintAta: userAta,
                    });

                    destinationTokenRecord = findUserTokenRecord({
                        mint: itemToSell.mint,
                        userMintAta: userPdaAta,
                    });

                    authRules = await findRuleSet({
                        connection: Data.program.provider.connection,
                        mint: itemToSell.mint,
                    });
                }
                subInstructions.push(
                    await Data.program.methods
                        .userModifyPNftSell(itemToSell, Data.is_removeItem, userSeeds, userBump)
                        .accounts({
                            userPda,
                            user: Data.signer,
                            signer: Data.signer,
                            userAta,
                            userPdaAta,
                            mint: itemToSell.mint,

                            nftMetadata,
                            nftMasterEdition,
                            ownerTokenRecord,
                            destinationTokenRecord,
                            authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                            authRules,

                            systemProgram: SystemProgram.programId.toBase58(),
                            metadataProgram: TOKEN_METADATA_PROGRAM,
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                            splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                            splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                            tokenProgram: TOKEN_PROGRAM_ID,
                        })
                        .instruction()
                );
                instructions.push(subInstructions);
            }
        })
    );
    return instructions;
};
