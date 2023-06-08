import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../../utils/const";
import { Data } from "@metaplex-foundation/mpl-token-metadata";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getDepositSolInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{
    instructions: TransactionInstruction[];
    newAtas: PublicKey[];
}> {
    let instructions: TransactionInstruction[] = [];

    let swapDataAccountAta = Data.swapIdentity.swapDataAccount_publicKey;
    let signerAta = Data.signer;
    let newAtas = Data.ataList;

    if (Data.mint !== SystemProgram.programId) {
        const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
            program: Data.program,
            owner: Data.signer,
            mint: Data.mint,
            signer: Data.signer,
            isFrontEndFunction: false,
        });
        signerAta = userAta;
        if (userAtaIx && !Data.ataList.includes(userAta)) {
            instructions.push(userAtaIx);
            newAtas.push(userAta);
            console.log("createUserAta CancelNft Tx Added", userAtaIx);
        } else {
            console.log("user Ata skipped", userAta.toBase58());
        }

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
            console.log("createPdaAta DepositNft Tx Added", pdaAta.toBase58());
        } else {
            console.log("pda Ata skipped", pdaAta.toBase58());
        }
    }

    instructions.push(
        await Data.program.methods
            .depositSol(
                Data.swapIdentity.swapDataAccount_seed,
                // Data.swapIdentity.swapDataAccount_bump
            )
            .accounts({
                systemProgram: SystemProgram.programId.toString(),
                splTokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toString(),
                swapDataAccountAta,
                signer: Data.signer.toString(),
                signerAta,
            })
            .instruction()
    );
    return { instructions, newAtas };
}
