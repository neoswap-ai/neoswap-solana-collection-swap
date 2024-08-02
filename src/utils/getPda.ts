import { PublicKey } from "@solana/web3.js";

export function getSdaSeed(maker: string, makerMint: string) {
    let string = "swap" + maker + makerMint;
    let array = [
        Buffer.from("swap"),
        new PublicKey(maker).toBuffer(),
        new PublicKey(makerMint).toBuffer(),
    ];
    let buffer = array.map((str) => {
        return Uint8Array.from(str);
    });
    // console.log(buffer, "getSdaSeed", { string, array });
    return {
        buffer,
        string,
    };
}

export function getSda(maker: string, makerMint: string, programId: string) {
    console.log("getSda", { maker, makerMint, programId });

    return PublicKey.findProgramAddressSync(
        getSdaSeed(maker, makerMint).buffer,
        new PublicKey(programId)
    )[0].toString();
}
