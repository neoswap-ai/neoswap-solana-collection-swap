const { TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
const findOrCreateAta = require("../../utils/findOrCreateAta.function");
const { SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const findNftDataAndMetadataAccount = require("../../utils/findNftDataAndMetadataAccount.function");

async function getClaimNftInstructions({ program, user, mint, signer, swapIdentity, ataList }) {
    let instruction = [];
    let mintAta = [];

    const { mintAta: userMintAta, instruction: userMintAtaTx } = await findOrCreateAta({
        program: program,
        owner: user,
        mint: mint,
        signer: signer,
    });
    mintAta.push(userMintAta);

    let addUserTx = true;
    ataList.forEach((ata) => {
        if (ata.toString() === userMintAta.toString()) {
            addUserTx = false;
        }
    });
    if (userMintAtaTx && addUserTx) {
        userMintAtaTx.forEach((userMintAtaTxItem) => {
            instruction.push(userMintAtaTxItem);
        });
        console.log("createUserAta ClaimNft Tx Added");
    }

    const { mintAta: pdaMintAta, instruction: pdaMintAtaTx } = await findOrCreateAta({
        program: program,
        owner: swapDataAccount,
        mint: mint,
        signer: signer,
    });
    mintAta.push(pdaMintAta);

    let addPdaTx = true;
    ataList.forEach((ata) => {
        if (ata.toString() === pdaMintAta.toString()) {
            addPdaTx = false;
        }
    });
    if (pdaMintAtaTx && addPdaTx) {
        pdaMintAtaTx.forEach((pdaMintAtaTxItem) => {
            instruction.push(pdaMintAtaTxItem);
        });

        console.log("createPdaAta ClaimNft Tx Added");
    }

    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        metadataBump: nftMetadata_bump,
    } = await findNftDataAndMetadataAccount({
        connection: program.provider.connection,
        mint,
    });
    console.log("nftMetadata", nftMetatoBase58());

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if pNFT
        const { adddress: nftMasterEdition, bump: nftMasterEdition_bump } =
            solanaNFT.findNftMasterEdition({ mint });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const { adddress: ownerTokenRecord, bump: ownerTokenRecord_bump } =
            solanaNFT.findUserTokenRecord({
                mint,
                userMintAta: pdaAta,
            });
        console.log("ownerTokenRecord", ownerTokenRecord.toBase58());
        const { adddress: destinationTokenRecord, bump: destinationTokenRecord_bump } =
            solanaNFT.findUserTokenRecord({
                mint,
                userMintAta: userAta,
            });
        console.log("destinationTokenRecord", destinationTokenRecord.toBase58());
        const authRules = await solanaNFT.findRuleSet({
            connection: program.provider.connection,
            mint,
        });
        instructions.push(
            await program.methods
                .claimNft(SDA.seed, SDA.bump, nftMetadata_bump)
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: process.env.TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: SDA.SDA,
                    user: owner.toBase58(),
                    signer: signer.publicKey.toBase58(),
                    itemFromDeposit: pdaAta.toBase58(),
                    itemToDeposit: userAta.toBase58(),
                    mint: mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: CONSTS.METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .signers([signer])
                .instruction()
        );
    } else {
        instructions.push(
            await program.methods
                .claimNft(SDA.seed, SDA.bump, nftMetadata_bump)
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: process.env.TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: SDA.SDA,
                    user: owner.toBase58(),
                    signer: signer.publicKey.toBase58(),
                    itemFromDeposit: pdaAta.toBase58(),
                    itemToDeposit: userAta.toBase58(),
                    mint: mint.toBase58(),
                    nftMetadata: nftMetatoBase58(),
                    nftMasterEdition: program.programId.toBase58(),
                    ownerTokenRecord: program.programId.toBase58(),
                    destinationTokenRecord: program.programId.toBase58(),
                    authRulesProgram: program.programId.toBase58(),
                    authRules: program.programId.toBase58(),
                })
                .signers([signer])
                .instruction()
        );
    }
    return { instruction, mintAta };
}

module.exports = getClaimNftInstructions;
