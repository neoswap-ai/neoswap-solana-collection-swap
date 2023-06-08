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
import { ApiProcessorConfigType, SwapIdentity } from "../../utils/types";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";

export async function prepareDepositNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{
    instructions: ApiProcessorConfigType[];
    newAtas: PublicKey[];
}> {
    let instructions: ApiProcessorConfigType[] = [];
    let newAtas: PublicKey[] = [];

    const { mintAta: userAta, prepareInstruction: userAtaIx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
        isFrontEndFunction: true,
    });
    if (userAtaIx && !Data.ataList.includes(userAta)) {
        instructions.push(userAtaIx);
        newAtas.push(userAta);
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
        newAtas.push(pdaAta);
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
        // console.log('nftMasterEdition', nftMasterEdition.toString());
        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: userAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toString());
        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toString());
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
                    systemProgram: SystemProgram.programId.toString(),
                    metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toString(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID.toString(),
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toString(),
                    signer: Data.signer.toString(),
                    itemFromDeposit: userAta.toString(),
                    mint: Data.mint.toString(),
                    nftMetadata: nftMetadata.toString(),
                    itemToDeposit: pdaAta.toString(),
                    nftMasterEdition: nftMasterEdition.toString(),
                    ownerTokenRecord: ownerTokenRecord.toString(),
                    destinationTokenRecord: destinationTokenRecord.toString(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM.toString(),
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
                    systemProgram: SystemProgram.programId.toString(),
                    metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toString(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID.toString(),
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toString(),
                    signer: Data.signer.toString(),
                    itemFromDeposit: userAta.toString(),
                    mint: Data.mint.toString(),
                    nftMetadata: nftMetadata.toString(),
                    itemToDeposit: pdaAta.toString(),
                    nftMasterEdition: Data.signer.toString(),
                    ownerTokenRecord: Data.signer.toString(),
                    destinationTokenRecord: Data.signer.toString(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM.toString(),
                    authRules: Data.signer.toString(),
                },
            },
        });
    }
    return { instructions, newAtas };
}
