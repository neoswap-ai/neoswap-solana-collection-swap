import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../../utils/findNftDataAndAccounts.function";

import { Program } from "@project-serum/anchor";
import { SwapIdentity } from "../../utils/types";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";

export async function getDepositNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}) {
    let instructions = [];
    let newAtas = [];

    const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
        isFrontEndFunction: false,
    });
    if (userAtaIx && !Data.ataList.includes(userAta)) {
        instructions.push(userAtaIx);
        newAtas.push(userAta);
        console.log("createUserAta CancelNft Tx Added", userAtaIx);
    } else {
        console.log("user Ata skipped", userAta.toBase58());
    }

    const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
        isFrontEndFunction: false,
    });
    // console.log("pdaAtaIx", pdaAta.toBase58());
    if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
        instructions.push(pdaAtaIx);
        newAtas.push(pdaAta);
        console.log("createPdaAta DepositNft Tx Added", pdaAta.toBase58());
    } else {
        console.log("pda Ata skipped", pdaAta.toBase58());
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
        instructions.push(
            await Data.program.methods
                .depositNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump
                )
                .accounts({
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
                })
                .instruction()
        );
        // console.log("depositNftTx - seed", Data.swapIdentity.swapDataAccount_seed.toString());
    } else {
        instructions.push(
            await Data.program.methods
                .depositNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    Data.swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump
                )
                .accounts({
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
