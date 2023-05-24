import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";

export async function getDepositSolInstruction(Data: {
    program: Program;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
}) {
    return await Data.program.methods
        .depositSol(Data.swapIdentity.swapDataAccount_seed, Data.swapIdentity.swapDataAccount_bump)
        .accounts({
            systemProgram: SystemProgram.programId.toString(),
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toString(),
            signer: Data.signer.toString(),
        })
        .instruction();
}
