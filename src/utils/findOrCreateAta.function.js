const {
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
} = require("@solana/spl-token");
const { PublicKey } = require("@solana/web3.js");

async function findOrCreateAta({program, owner, mint, signer,isFrontEndFunction}) {
    try {
        return {
            mintAta: (
                await program.provider.connection.getTokenAccountsByOwner(owner, {
                    mint: mint,
                })
            ).value[0].pubkey,
        };
    } catch (error) {
        let res;
        // if (isFrontEndFunction === true) {
        //     res = await solanaSwap.createPdaAtaforDeposit({ mint, signer, owner });
        // } else {
        const [mintAta, mintAta_bump] = PublicKey.findProgramAddressSync(
            [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            new PublicKey(process.env.SOLANA_SPL_ATA_PROGRAM_ID)
        );
        if (isFrontEndFunction) {
            return {
                mintAta,
                prepareInstruction: {
                    type: "createAssociatedTokenAccountInstruction",
                    data: {
                        payer: signer.publicKey,
                        associatedToken: mintAta,
                        owner,
                        mint,
                    },
                },
            };
        } else {
            const instruction = createAssociatedTokenAccountInstruction(
                signer.publicKey,
                mintAta,
                owner,
                mint
            );

            return { mintAta, instruction };
        }
    }
}

module.exports = findOrCreateAta;
