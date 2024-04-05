import { createCloseAccountInstruction, createSyncNativeInstruction } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export function addWSol(owner: string, ownerAta: string, lamports: number) {
    return [
        SystemProgram.transfer({
            fromPubkey: new PublicKey(owner),
            toPubkey: new PublicKey(ownerAta),
            lamports,
        }),
        createSyncNativeInstruction(new PublicKey(ownerAta)),
    ];
}

export function closeWSol(owner: string, destinary: string, ownerAta: string) {
    return createCloseAccountInstruction(
        new PublicKey(ownerAta),
        new PublicKey(destinary),
        new PublicKey(owner)
    );
}
