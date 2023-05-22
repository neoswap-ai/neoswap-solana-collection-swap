const findOrCreateAta = require("../../utils/findOrCreateAta.function");
const { SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { TokenStandard, Uses } = require("@metaplex-foundation/mpl-token-metadata");

async function prepareDepositNftInstruction({
    program,
    signer,
    mint,
    swapIdentity,
    //const swapIdentity: {
    //     swapDataAccount_publicKey: PublicKey;
    //     swapDataAccount_seed: Buffer;
    //     swapDataAccount_bump: number;
    //     preSeed: any;
    //     swapData: any;
    // }
    ataList,
}) {
    let instructions = [];
    let mintAta = [];

    const { mintAta: userAta, prepareInstruction: userAtaIx } = await findOrCreateAta({
        program,
        owner: signer,
        mint,
        signer,
        isFrontEndFunction: true,
    });
    if (userAtaIx && !ataList.includes(userAta.toString())) {
        instructions.push(userAtaIx);
        mintAta.push(userAta.toString());
        console.log("createUserAta CancelNft Tx Added", userAtaIx);
    } else {
        console.log("user Ata skipped");
    }

    const { mintAta: pdaAta, prepareInstruction: pdaAtaIx } = await findOrCreateAta({
        program,
        owner: swapIdentity.swapDataAccount_publicKey,
        mint,
        signer,
        isFrontEndFunction: true,
    });
    console.log("pdaAtaIx", pdaAtaIx);
    if (pdaAtaIx && !ataList.includes(pdaAta.toString())) {
        instructions.push(pdaAtaIx);
        mintAta.push(pdaAta.toString());
        console.log("createPdaAta DepositNft Tx Added", pdaAtaIx);
    } else {
        console.log("pda Ata skipped");
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
        ///if New metaplex standard
        const { adddress: nftMasterEdition } = solanaNFT.findNftMasterEdition({
            mint,
        });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const { adddress: ownerTokenRecord } = solanaNFT.findUserTokenRecord({
            mint,
            userMintAta: userAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toBase58());
        const { adddress: destinationTokenRecord } = solanaNFT.findUserTokenRecord({
            mint,
            userMintAta: pdaAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());
        const authRules = await solanaNFT.findRuleSet({
            connection: program.provider.connection,
            mint,
        });
        
        instructions.push({
            programId: program.programId.toString(),
            type: "depositNft",
            data: {
                arguments: {
                    SDA_seed: swapIdentity.swapDataAccount_seed.toString(),
                    SDA_bump: swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump: nftMetadata_bump,
                },
                accounts: {
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: process.env.TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: CONSTS.METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                },
            },
        });
        console.log("depositNftTx - seed", instructions.at(-1).data.arguments.SDA_seed.toString());
    } else {
        instructions.push({
            programId: program.programId.toString(),
            type: "depositNft",
            data: {
                arguments: {
                    SDA_seed: swapIdentity.swapDataAccount_seed.toString(),
                    SDA_bump: swapIdentity.swapDataAccount_bump,
                    nftMetadata_bump: nftMetadata_bump,
                },
                accounts: {
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: process.env.TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: program.programId,
                    ownerTokenRecord: program.programId,
                    destinationTokenRecord: program.programId,
                    authRulesProgram: program.programId,
                    authRules: program.programId,
                },
            },
        });
    }
    return { instructions, mintAta };
}

module.exports = prepareDepositNftInstruction;
