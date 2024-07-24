import {
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export function addWSol(owner: string, ownerAta: string, lamports: number) {
    return [
        // createTransferInstruction(
        //     new PublicKey(owner),
        //     new PublicKey(ownerAta),
        //     new PublicKey(owner),
        //     lamports
        // ),
        SystemProgram.transfer({
            fromPubkey: new PublicKey(owner),
            toPubkey: new PublicKey(ownerAta),
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createSyncNativeInstruction(new PublicKey(ownerAta), TOKEN_PROGRAM_ID),
    ];
}

export function closeWSol(owner: string, destinary: string, ownerAta: string) {
    console.log("closeWSol", owner);
    return createCloseAccountInstruction(
        new PublicKey(ownerAta),
        new PublicKey(destinary),
        new PublicKey(owner)
    );
}
