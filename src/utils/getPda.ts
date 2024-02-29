import { PublicKey } from "@solana/web3.js";

export function getSdaSeed(maker: PublicKey, makerMint: PublicKey) {
    let string = maker.toString().slice(0, 16) + makerMint.toString().slice(0, 16);
    return { buffer: [Buffer.from(string)], string };
}

export function getSda(maker: PublicKey, makerMint: PublicKey, programId: PublicKey) {
    return PublicKey.findProgramAddressSync(getSdaSeed(maker, makerMint).buffer, programId)[0];
}
