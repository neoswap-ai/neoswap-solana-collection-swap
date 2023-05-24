import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";

export async function getCancelSolInstructions(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
}) {
    return {
        instruction: await Data.program.methods
            .cancelSol(
                Data.swapIdentity.swapDataAccount_seed,
                Data.swapIdentity.swapDataAccount_bump
            )
            .accounts({
                systemProgram: SystemProgram.programId,
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                user: Data.user,
                signer: Data.signer,
            })
            .instruction(),
    };
}

