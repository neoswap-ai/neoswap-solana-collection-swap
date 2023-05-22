import { Program, web3 } from "@project-serum/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export async function claimSol(
    program,
    user,
    signer,
    swapDataAccount,
    swapDataAccount_seed,
    swapDataAccount_bump
) {
    return {
        instruction: await program.methods
            .claimSol(swapDataAccount_seed, swapDataAccount_bump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                swapDataAccount: swapDataAccount,
                user: user,
                signer: signer,
            })
            .instruction(),
    };
}

export default claimSol;
