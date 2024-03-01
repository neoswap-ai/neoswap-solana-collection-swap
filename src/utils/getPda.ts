import { PublicKey } from "@solana/web3.js";

export function getSdaSeed(maker: string, makerMint: string) {
    let string = maker.slice(0, 16) + makerMint.slice(0, 16);
    return { buffer: [Buffer.from(string)], string };
}

export function getSda(maker: string, makerMint: string, programId: string) {
    return PublicKey.findProgramAddressSync(
        getSdaSeed(maker, makerMint).buffer,
        new PublicKey(programId)
    )[0].toString();
}
