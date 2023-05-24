import { Program, web3 } from "@project-serum/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";

export async function getClaimSolInstructions(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
}) {
    return {
        instruction: await Data.program.methods
            .claimSol(
                Data.swapIdentity.swapDataAccount_seed,
                Data.swapIdentity.swapDataAccount_bump
            )
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                user: Data.user,
                signer: Data.signer,
            })
            .instruction(),
    };
}

