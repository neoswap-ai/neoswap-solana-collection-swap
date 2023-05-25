import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../../utils/findNftDataAndAccounts.function";

import { Program } from "@project-serum/anchor";
import { SwapIdentity } from "../../utils/types";
import { METAPLEX_AUTH_RULES_PROGRAM, SOLANA_SPL_ATA_PROGRAM_ID, TOKEN_METADATA_PROGRAM } from "../../utils/const";

export async function prepareDepositNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}) {
    let instructions = [];
    let mintAta = [];

    const { mintAta: userAta, prepareInstruction: userAtaIx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
        isFrontEndFunction: true,
    });
    if (userAtaIx && !Data.ataList.includes(userAta)) {
        instructions.push(userAtaIx);
        mintAta.push(userAta);
        console.log("createUserAta CancelNft Tx Added", userAtaIx);
    } else {
        console.log("user Ata skipped");
    }

    const { mintAta: pdaAta, prepareInstruction: pdaAtaIx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
        isFrontEndFunction: true,
    });
    console.log("pdaAtaIx", pdaAtaIx);
    if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
        instructions.push(pdaAtaIx);
        mintAta.push(pdaAta);
        console.log("createPdaAta DepositNft Tx Added", pdaAtaIx);
    } else {
        console.log("pda Ata skipped");
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
        ///if New metaplex standard
        const nftMasterEdition = findNftMasterEdition({
            mint: Data.mint,
        });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: userAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toBase58());
        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());
        const authRules = await findRuleSet({
            connection: Data.program.provider.connection,
            mint: Data.mint,
        });

        instructions.push({
            programId: Data.program.programId.toString(),
            type: "depositNft",
            data: {
                arguments: {
                    SDA_seed: Data.swapIdentity.swapDataAccount_seed.toString(),
                    SDA_bump: Data.swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump: nftMetadata_bump,
                },
                accounts: {
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                },
            },
        });
        // console.log("depositNftTx - seed", Data.swapIdentity.swapDataAccount_seed.toString());
    } else {
        instructions.push({
            programId: Data.program.programId.toString(),
            type: "depositNft",
            data: {
                arguments: {
                    SDA_seed: Data.swapIdentity.swapDataAccount_seed.toString(),
                    SDA_bump: Data.swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump: nftMetadata_bump,
                },
                accounts: {
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: Data.program.programId,
                    ownerTokenRecord: Data.program.programId,
                    destinationTokenRecord: Data.program.programId,
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: Data.program.programId,
                },
            },
        });
    }
    return { instructions, mintAta };
}
