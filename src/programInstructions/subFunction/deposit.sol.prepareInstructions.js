const { SystemProgram } = require("@solana/web3.js");
async function prepareDepositSolInstruction({ from, to, swapIdentity }) {
    return {
        type: "depositSol",
        data: {
            arguments: {
                seed: swapIdentity.swapDataAccount_seed,
                bump: swapIdentity.swapDataAccount_bump,
            },
            accounts: {
                systemProgram: SystemProgram.programId.toString(),
                swapDataAccount: to.toString(),
                signer: from.toString(),
            },
        },
    };
}
module.exports = prepareDepositSolInstruction;
