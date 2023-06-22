import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ApiProcessorConfigType, SwapIdentity } from "../../utils/types";
import { SWAP_PROGRAM_ID } from "../../utils/const";
import { Program } from "@project-serum/anchor";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";

export async function prepareDepositSolInstruction(Data: {
    // programId: PublicKey;
    // from: PublicKey;
    // to: PublicKey;
    program: Program;
    swapIdentity: SwapIdentity;
    signer: PublicKey;
    mint: PublicKey;
    ataList: PublicKey[];
}): Promise<{
    instructions: ApiProcessorConfigType[];
    newAtas: PublicKey[];
}> {
    let instructions: ApiProcessorConfigType[] = [];
    let newAtas: PublicKey[] = [];
    let userAta = Data.signer;
    let swapDataAccountAta = Data.swapIdentity.swapDataAccount_publicKey;

    if (Data.mint !== SystemProgram.programId) {
        const { mintAta: foundUserAta, prepareInstruction: userAtaIx } = await findOrCreateAta({
            program: Data.program,
            owner: Data.signer,
            mint: Data.mint,
            signer: Data.signer,
            isFrontEndFunction: true,
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

        const { mintAta: pdaAta, prepareInstruction: pdaAtaIx } = await findOrCreateAta({
            program: Data.program,
            owner: Data.swapIdentity.swapDataAccount_publicKey,
            mint: Data.mint,
            signer: Data.signer,
            isFrontEndFunction: true,
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

    instructions.push({
        type: "depositSol",
        programId: Data.program.programId.toString(),
        data: {
            arguments: {
                seed: Data.swapIdentity.swapDataAccount_seed.toString(),
                // bump: Data.swapIdentity.swapDataAccount_bump,
            },
            accounts: {
                systemProgram: SystemProgram.programId.toString(),
                swapDataAccount: swapDataAccountAta.toString(),
                signer: userAta.toString(),
            },
        },
    });
    return { instructions, newAtas };
}
