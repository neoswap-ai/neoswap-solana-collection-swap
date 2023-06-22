import { Program, web3 } from "@project-serum/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../../utils/const";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getClaimSolInstructions(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    mint: PublicKey;
    ataList: PublicKey[];
}): Promise<{
    instructions: TransactionInstruction[];
    newAtas: PublicKey[];
}> {
    let instructions: TransactionInstruction[] = [];

    let swapDataAccountAta = Data.swapIdentity.swapDataAccount_publicKey;
    let userAta = Data.signer;
    let newAtas = [];

    if (Data.mint !== SystemProgram.programId) {
        const { mintAta: foundUserAta, instruction: userAtaIx } = await findOrCreateAta({
            program: Data.program,
            owner: Data.user,
            mint: Data.mint,
            signer: Data.signer,
            isFrontEndFunction: false,
        });
        userAta = foundUserAta;
        // console.log("userAta", userAta);

        if (userAtaIx && !Data.ataList.includes(userAta)) {
            instructions.push(userAtaIx);
            newAtas.push(userAta);
            console.log("createdestinaryAta ClaimSol Tx Added", userAta.toBase58());
        } 
        // else {
        //     console.log("user Ata ClaimSol skipped", userAta.toBase58());
        // }

        const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
            program: Data.program,
            owner: Data.swapIdentity.swapDataAccount_publicKey,
            mint: Data.mint,
            signer: Data.signer,
            isFrontEndFunction: false,
        });
        swapDataAccountAta = pdaAta;
        // console.log("pdaAtaIx", pdaAta.toBase58());
        if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
            instructions.push(pdaAtaIx);
            newAtas.push(pdaAta);
            console.log("createPdaAta ClaimSol Tx Added", pdaAta.toBase58());
        } 
        // else {
        //     console.log("pda Ata ClaimSol skipped", pdaAta.toBase58());
        // }
    }
    // console.log(" TOKEN_PROGRAM_ID)", TOKEN_PROGRAM_ID);
    // console.log(" Data.swapIdentity", Data.swapIdentity.swapDataAccount_publicKey);
    // console.log(" swapDataAccountAta)", swapDataAccountAta);
    // console.log(" Data.user", Data.user);
    // console.log(" userAta)", userAta);
    // console.log(" Data.signer", Data.signer);
    instructions.push(
        await Data.program.methods
            .claimSol(
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
