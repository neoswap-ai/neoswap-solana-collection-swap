const findOrCreateAta = require("../../utils/findOrCreateAta.function");
const { SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
const findNftDataAndMetadataAccount = require("../../utils/findNftDataAndMetadataAccount.function");
const findNftMasterEdition = require("../../utils/findNftMasterEdition.function");
const findUserTokenRecord = require("../../utils/findUserTokenRecord.function");
const findRuleSet = require("../../utils/findRuleSet.function");

async function getClaimNftInstructions({
    program,
    destinary,
    mint,
    signer,
    swapIdentity,
    ataList,
}) {
    let instruction = [];
    let mintAta = [];

    const { mintAta: destinaryMintAta, instruction: destinaryMintAtaTx } = await findOrCreateAta({
        program,
        owner: destinary,
        mint,
        signer,
    });
    mintAta.push(destinaryMintAta);

    let adddestinaryTx = true;
    ataList.forEach((ata) => {
        if (ata.toString() === destinaryMintAta.toString()) {
            adddestinaryTx = false;
        }
    });
    if (destinaryMintAtaTx && adddestinaryTx) {
        destinaryMintAtaTx.forEach((destinaryMintAtaTxItem) => {
            instruction.push(destinaryMintAtaTxItem);
        });
        console.log("createdestinaryAta ClaimNft Tx Added");
    }

    const { mintAta: pdaMintAta, instruction: pdaMintAtaTx } = await findOrCreateAta({
        program,
        owner: swapIdentity.swapDataAccount_publicKey,
        mint,
        signer,
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
        const nftMasterEdition = findNftMasterEdition({
            mint,
        });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());

        const ownerTokenRecord = findUserTokenRecord({
            mint,
            userMintAta: pdaMintAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toBase58());

        const destinationTokenRecord = findUserTokenRecord({
            mint,
            userMintAta: destinaryMintAta,
        });
        // console.log("destinationTokenRecord", destinationTokenRecord.toBase58());

        const authRules = await findRuleSet({
            connection: program.provider.connection,
            mint,
        });

        instruction.push(
            await program.methods
                .claimNft(
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
                    swapDataAccount: swapIdentity.swapDataAccount_publicKey,
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
                .instruction()
        );
    } else {
        instruction.push(
            await program.methods
                .claimNft(
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
                    swapDataAccount: swapIdentity.swapDataAccount_publicKey,
                    user: owner.toBase58(),
                    signer: signer.publicKey.toBase58(),
                    itemFromDeposit: pdaAta.toBase58(),
                    itemToDeposit: userAta.toBase58(),
                    mint: mint.toBase58(),
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
    return { instruction, mintAta };
}

module.exports = getClaimNftInstructions;
