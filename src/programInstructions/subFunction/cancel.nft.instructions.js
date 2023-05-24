const findOrCreateAta = require("../../utils/findOrCreateAta.function");
const { SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const CONSTS = require("../../utils/const");
const { TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
const findNftDataAndMetadataAccount = require("../../utils/findNftDataAndMetadataAccount.function");
const findNftMasterEdition = require("../../utils/findNftMasterEdition.function");
const findUserTokenRecord = require("../../utils/findUserTokenRecord.function");
const findRuleSet = require("../../utils/findRuleSet.function");

async function cancelNft({ program, signer, destinary, mint, swapIdentity, ataList }) {
    let instructions = [];
    let newAtas = [];

    const { mintAta: destinaryAta, instruction: destinaryAtaIx } = await findOrCreateAta({
        program,
        owner: destinary,
        mint,
        signer,
        frontEndFunction: false,
    });
    if (destinaryAtaIx && !ataList.includes(destinaryAta.toString())) {
        instructions.push(destinaryAtaIx);
        newAtas.push(destinaryAta.toString());
        console.log("destinaryteUserAta CancelNft Tx Added", destinaryAtaIx);
    }

    const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
        program,
        owner: swapIdentity.swapDataAccount_publicKey,
        mint,
        signer,
        frontEndFunction: false,
    });
    if (pdaAtaIx && !ataList.includes(pdaAta.toString())) {
        instructions.push(pdaAtaIx);
        newAtas.push(pdaAta.toString());
        console.log("createPdaAta CancelNft Tx Added", pdaAtaIx);
    }

    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        metadataBump: nftMetadata_bump,
    } = await findNftDataAndMetadataAccount({
        connection: program.provider.connection,
        mint,
    });

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if pNFT
        const nftMasterEdition = findNftMasterEdition({ mint });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const ownerTokenRecord = findUserTokenRecord({
            mint,
            userMintAta: pdaAta,
        });
        // console.log('ownerTokenRecord', ownerTokenRecord.toBase58());
        const destinationTokenRecord = findUserTokenRecord({
            mint,
            userMintAta: destinaryAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());
        const authRules = await findRuleSet({
            connection: program.provider.connection,
            mint,
        });
        instructions.push(
            await program.methods
                .cancelNft(
                    swapIdentity.swapDataAccount_seed,
                    swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: process.env.TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
                    user: destinary.toBase58(),
                    signer: signer.publicKey.toBase58(),
                    itemFromDeposit: pdaAta.toBase58(),
                    itemToDeposit: destinaryAta.toBase58(),
                    mint,
                    nftMetadata,
                    nftMasterEdition,
                    ownerTokenRecord,
                    destinationTokenRecord,
                    authRulesProgram: CONSTS.METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .instruction()
        );
    } else {
        instructions.push(
            await program.methods
                .cancelNft(
                    swapIdentity.swapDataAccount_seed,
                    swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: process.env.TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
                    user: owner.toBase58(),
                    signer: signer.publicKey.toBase58(),
                    itemFromDeposit: pdaAta.toBase58(),
                    itemToDeposit: destinaryAta.toBase58(),
                    mint,
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: program.programId.toBase58(),
                    ownerTokenRecord: program.programId.toBase58(),
                    destinationTokenRecord: program.programId.toBase58(),
                    authRulesProgram: CONSTS.METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: program.programId.toBase58(),
                })
                .instruction()
        );
    }

    return { instructions, newAtas };
}

module.exports = cancelNft;
