const { SystemProgram } = require("@solana/web3.js");
async function getDepositSolInstruction({ signer, swapIdentity }) {
    return await program.methods
        .depositSol(swapIdentity.swapDataAccount_seed, swapIdentity.swapDataAccount_bump)
        .accounts({
            systemProgram: SystemProgram.programId.toString(),
            swapDataAccount: swapIdentity.swapDataAccount_publicKey.toString(),
            signer,
        })
        .instruction();
}
module.exports = getDepositSolInstruction;
