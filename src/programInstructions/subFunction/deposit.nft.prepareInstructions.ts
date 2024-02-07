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

import { Program } from "@coral-xyz/anchor";
import { ApiProcessorConfigType, DepositNft, SwapIdentity } from "../../utils/types";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";
import { errorIfInsufficientBalance } from "../../utils/errorIfInsufficientBalance.function";

export async function prepareDepositNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    amount: number;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{
    instructions: ApiProcessorConfigType[];
    newAtas: PublicKey[];
}> {

    await errorIfInsufficientBalance({
        amount: Data.amount,
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
    });

    
    let instructions: ApiProcessorConfigType[] = [];
    let newAtas: PublicKey[] = [];

    const { mintAta: userAta, prepareInstruction: userAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
        prepareInstructions: true,
    });
    if (userAtaIx && !Data.ataList.includes(userAta)) {
        instructions.push(userAtaIx);
        newAtas.push(userAta);
        console.log("createUserAta DepositNft Tx Added", userAta.toBase58());
    }

    const { mintAta: pdaAta, prepareInstruction: pdaAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
        prepareInstructions: true,
    });
    if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
        instructions.push(pdaAtaIx);
        newAtas.push(pdaAta);
        console.log("createPdaAta DepositNft Tx Added", pdaAta.toBase58());
    }

    const { tokenStandard, metadataAddress: nftMetadata } = await findNftDataAndMetadataAccount({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        const nftMasterEdition = findNftMasterEdition({
            mint: Data.mint,
        });
        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: userAta,
        });
        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaAta,
        });
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
                },
                accounts: {
                    systemProgram: SystemProgram.programId.toString(),
                    metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
                    tokenProgram: TOKEN_PROGRAM_ID.toString(),
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID.toString(),
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
                    authRules: authRules.toString(),
                },
            },
        } as DepositNft);
    } else {
        instructions.push({
            programId: Data.program.programId.toString(),
            type: "depositNft",
            data: {
                arguments: {
                    SDA_seed: Data.swapIdentity.swapDataAccount_seed.toString(),
                },
                accounts: {
                    systemProgram: SystemProgram.programId.toString(),
                    metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
                    tokenProgram: TOKEN_PROGRAM_ID.toString(),
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID.toString(),
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
        } as DepositNft);
    }
    return { instructions, newAtas };
}
