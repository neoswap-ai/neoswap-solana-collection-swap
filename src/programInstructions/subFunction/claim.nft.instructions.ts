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
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";

export async function getClaimNftInstructions(Data: {
    program: Program;
    destinary: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}) {
    let instruction = [];
    let mintAta = [];

    const { mintAta: destinaryMintAta, instruction: destinaryMintAtaTx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.destinary,
        mint: Data.mint,
        signer: Data.signer,
    });
    mintAta.push(destinaryMintAta);

    let adddestinaryTx = true;
    Data.ataList.forEach((ata) => {
        if (ata.toString() === destinaryMintAta.toString()) {
            adddestinaryTx = false;
        }
    });
    if (destinaryMintAtaTx && adddestinaryTx) {
        instruction.push(destinaryMintAtaTx);

        console.log("createdestinaryAta ClaimNft Tx Added", destinaryMintAta.toBase58());
    }

    const { mintAta: pdaMintAta, instruction: pdaMintAtaTx } = await findOrCreateAta({
        program: Data.program,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
    });
    mintAta.push(pdaMintAta);

    let addPdaTx = true;
    Data.ataList.forEach((ata) => {
        if (ata.toString() === pdaMintAta.toString()) {
            addPdaTx = false;
        }
    });
    if (pdaMintAtaTx && addPdaTx) {
        instruction.push(pdaMintAtaTx);
        console.log("createPdaAta ClaimNft Tx Added");
    }

    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        metadataBump: nftMetadata_bump,
    } = await findNftDataAndMetadataAccount({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });
    // console.log("nftMetadata", nftMetadata.toBase58());

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if pNFT
        const nftMasterEdition = findNftMasterEdition({
            mint: Data.mint,
        });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());

        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaMintAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toBase58());

        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: destinaryMintAta,
        });
        // console.log("destinationTokenRecord", destinationTokenRecord.toBase58());

        const authRules = await findRuleSet({
            connection: Data.program.provider.connection,
            mint: Data.mint,
        });

        instruction.push(
            await Data.program.methods
                .claimNft(
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
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    user: Data.destinary.toBase58(),
                    signer: Data.signer.toBase58(),
                    itemFromDeposit: pdaMintAta.toBase58(),
                    itemToDeposit: destinaryMintAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .instruction()
        );
    } else {
        instruction.push(
            await Data.program.methods
                .claimNft(
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
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                    user: Data.destinary.toBase58(),
                    signer: Data.signer.toBase58(),
                    itemFromDeposit: pdaMintAta.toBase58(),
                    itemToDeposit: destinaryMintAta.toBase58(),
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
    return { instruction, mintAta };
}
