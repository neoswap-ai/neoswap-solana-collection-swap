const { TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
const findOrCreateAta = require("../../utils/findOrCreateAta.function");
const { SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const findNftDataAndMetadataAccount = require("../../utils/findNftDataAndMetadataAccount.function");
const findNftMasterEdition = require("../../utils/findNftMasterEdition.function");
const findUserTokenRecord = require("../../utils/findUserTokenRecord.function");
const findRuleSet = require("../../utils/findRuleSet.function");

async function getDepositNftInstruction({
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

    const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
        program,
        owner: signer,
        mint,
        signer,
        frontEndFunction: true,
    });
    if (userAtaIx && !ataList.includes(userAta.toString())) {
        instructions.push(userAtaIx);
        mintAta.push(userAta.toString());
        console.log("createUserAta CancelNft Tx Added", userAtaIx);
    } else {
        console.log("user Ata skipped");
    }

    const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
        program,
        owner: swapIdentity.swapDataAccount_publicKey,
        mint,
        signer,
        frontEndFunction: true,
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
        const { adddress: nftMasterEdition } = findNftMasterEdition({
            mint,
        });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());

        const { adddress: ownerTokenRecord } = findUserTokenRecord({
            mint,
            userMintAta: userAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toBase58());

        const { adddress: destinationTokenRecord } = findUserTokenRecord({
            mint,
            userMintAta: pdaAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());

        const authRules = await findRuleSet({
            connection: program.provider.connection,
            mint,
        });
        instructions.push(
            await program.methods
                .depositNft(
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
                })
                .instruction()
        );
        console.log("depositNftTx - seed", swapIdentity.swapDataAccount_seed.toString());
    } else {
        instructions.push(
            await program.methods
                .depositNft(
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
                    signer: signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: program.programId,
                    ownerTokenRecord: program.programId,
                    destinationTokenRecord: program.programId,
                    authRulesProgram: CONSTS.METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: program.programId,
                })
                .instruction()
        );
    }
    return { instructions, mintAta };
}

module.exports = getDepositNftInstruction;
