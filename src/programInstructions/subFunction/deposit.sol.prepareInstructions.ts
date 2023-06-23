import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ApiProcessorConfigType, SwapIdentity } from "../../utils/types";
import { SWAP_PROGRAM_ID } from "../../utils/const";
import { Program } from "@project-serum/anchor";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";

export async function prepareDepositSolInstruction(Data: {
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
            prepareInstructions: true,
        });
        userAta = foundUserAta;

        if (userAtaIx && !Data.ataList.includes(userAta)) {
            instructions.push(userAtaIx);
            newAtas.push(userAta);
            console.log("createUserAta DepositSol Tx Added", userAta.toBase58());
        }

        const { mintAta: pdaAta, prepareInstruction: pdaAtaIx } = await findOrCreateAta({
            program: Data.program,
            owner: Data.swapIdentity.swapDataAccount_publicKey,
            mint: Data.mint,
            signer: Data.signer,
            prepareInstructions: true,
        });
        swapDataAccountAta = pdaAta;
        if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
            instructions.push(pdaAtaIx);
            newAtas.push(pdaAta);
            console.log("createPdaAta DepositSol Tx Added", pdaAta.toBase58());
        }
    }

    instructions.push({
        type: "depositSol",
        programId: Data.program.programId.toString(),
        data: {
            arguments: {
                seed: Data.swapIdentity.swapDataAccount_seed.toString(),
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
