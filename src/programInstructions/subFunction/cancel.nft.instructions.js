import CONSTS from "../../utils/const";

const { TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
const findOrCreateAta = require("../../utils.neoSwap/findOrCreateAta.neoSwap");
const { SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const findNftMasterEdition = require("../../utils/findNftMasterEdition.function");
const findRuleSet = require("../../utils/findRuleSet.function");
const findUserTokenRecord = require("../../utils/findUserTokenRecord.function");

export async function cancelNft({ program, signer, user, mint, swapIdentity, ataList }) {
    let instructions = [];
    let newAtas = [];
    const { mintAta: userAta, instruction: userAtaIx } = await solanaSwap.findOrCreateAta({
        program,
        owner,
        mint,
        signer,
        frontEndFunction: false,
    });
    if (userAtaIx && !ataList.includes(userAta.toString())) {
        instructions.push(userAtaIx);
        newAtas.push(userAta.toString());
        console.log("createUserAta CancelNft Tx Added", userAtaIx);
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

    const { adddress: nftMetadata, bump: nftMetadata_bump } = findNftMetadataAccount({
        mint,
    });
    console.log("nftMetadata", nftMetadata.toBase58());

    if (true) {
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
            userMintAta: userAta,
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
                    user: owner.toBase58(),
                    signer: signer.publicKey.toBase58(),
                    itemFromDeposit: pdaAta.toBase58(),
                    itemToDeposit: userAta.toBase58(),
                    mint,
                    nftMetadata,
                    nftMasterEdition,
                    ownerTokenRecord,
                    destinationTokenRecord,
                    authRulesProgram: CONSTS.METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .signers([signer])
                .instruction()
        );
    } else {
        // OCP
    }

    return { instructions, newAtas };
}

export default cancelNft;
