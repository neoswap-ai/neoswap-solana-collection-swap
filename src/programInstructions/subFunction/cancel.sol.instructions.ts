import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getCancelSolInstructions(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
    mint: PublicKey;
}): Promise<{
    instructions: TransactionInstruction[];
    newAtas: PublicKey[];
}> {
    let instructions: TransactionInstruction[] = [];

    let swapDataAccountAta = Data.swapIdentity.swapDataAccount_publicKey;
    let userAta = Data.signer;
    let newAtas = [];

    if (!Data.mint.equals(SystemProgram.programId)) {
        const { mintAta: foundUserAta, instruction: userAtaIx } = await findOrCreateAta({
            connection: Data.program.provider.connection,
            owner: Data.user,
            mint: Data.mint,
            signer: Data.signer,
        });
        userAta = foundUserAta;

        if (userAtaIx && !Data.ataList.includes(userAta)) {
            instructions.push(userAtaIx);
            newAtas.push(userAta);
            console.log("createUserAta CancelSol Tx Added", userAta.toBase58());
        }

        const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
            connection: Data.program.provider.connection,
            owner: Data.swapIdentity.swapDataAccount_publicKey,
            mint: Data.mint,
            signer: Data.signer,
        });
        swapDataAccountAta = pdaAta;
        if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
            instructions.push(pdaAtaIx);
            newAtas.push(pdaAta);
            console.log("createPdaAta CancelSol Tx Added", pdaAta.toBase58());
        }
    }
    instructions.push(
        await Data.program.methods
            .cancelSol(
                Data.swapIdentity.swapDataAccount_seed,
                Data.swapIdentity.swapDataAccount_bump
            )
            .accounts({
                systemProgram: SystemProgram.programId,
                splTokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
                swapDataAccountAta,
                user: Data.user,
                userAta,
                signer: Data.signer,
            })
            .instruction()
    );
    return {
        instructions,
        newAtas,
    };
}
