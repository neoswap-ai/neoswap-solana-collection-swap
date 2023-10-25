import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import {
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
import { Program } from "@coral-xyz/anchor";
import { SwapIdentity } from "../../utils/types";

export async function getCancelNftInstructions(Data: {
    program: Program;
    signer: PublicKey;
    owner: PublicKey;
    mint: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{
    instructions: TransactionInstruction[];
    newAtas: PublicKey[];
}> {
    let instructions: TransactionInstruction[] = [];
    let newAtas: PublicKey[] = [];
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 600000,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1,
    });
    instructions.push(modifyComputeUnits);
    instructions.push(addPriorityFee);
    const { mintAta: destinaryAta, instruction: destinaryAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.owner,
        mint: Data.mint,
        signer: Data.signer,
    });
    if (destinaryAtaIx && !Data.ataList.includes(destinaryAta)) {
        instructions.push(destinaryAtaIx);
        newAtas.push(destinaryAta);
        console.log("createUserAta CancelNft Tx Added", destinaryAtaIx);
    }

    const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
    });
    if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
        instructions.push(pdaAtaIx);
        newAtas.push(pdaAta);
        console.log("createPdaAta CancelNft Tx Added", pdaAtaIx);
    }

    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        metadataBump: nftMetadata_bump,
    } = await findNftDataAndMetadataAccount({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if pNFT
        const nftMasterEdition = findNftMasterEdition({ mint: Data.mint });
        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaAta,
        });
        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: destinaryAta,
        });
        const authRules = await findRuleSet({
            connection: Data.program.provider.connection,
            mint: Data.mint,
        });
        instructions.push(
            await Data.program.methods
                .cancelNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    user: Data.owner.toBase58(),
                    signer: Data.signer.toBase58(),
                    swapDataAccountAta: pdaAta.toBase58(),
                    userAta: destinaryAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata,
                    nftMasterEdition,
                    ownerTokenRecord,
                    destinationTokenRecord,
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .instruction()
        );
    } else {
        instructions.push(
            await Data.program.methods
                .cancelNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    user: Data.owner.toBase58(),
                    signer: Data.signer.toBase58(),
                    swapDataAccountAta: pdaAta.toBase58(),
                    userAta: destinaryAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: Data.signer.toBase58(),
                    ownerTokenRecord: Data.signer.toBase58(),
                    destinationTokenRecord: Data.signer.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: Data.signer.toBase58(),
                })
                .instruction()
        );
    }

    return { instructions, newAtas };
}
