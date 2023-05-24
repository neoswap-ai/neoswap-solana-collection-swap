const { SystemProgram } = require("@solana/web3.js");

async function cancelSol({ program, user, signer, swapIdentity }) {
    return {
        instruction: await program.methods
            .cancelSol(swapIdentity.swapDataAccount_seed, swapIdentity.swapDataAccount_bump)
            .accounts({
                systemProgram: SystemProgram.programId,
                swapDataAccount: swapIdentity.swapDataAccount_publicKey,
                user: user,
                signer: signer,
            })
            .instruction(),
    };
}

module.exports = cancelSol;
