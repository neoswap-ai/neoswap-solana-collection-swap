import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { Metaplex } from "@metaplex-foundation/js";

export async function getCreatorData(Data: {
    taker: string;
    signer: string;
    nftMintTaker: string;
    nftMintMaker: string;
    connection: Connection;
    mintToken: string;
}) {
    let instructions: TransactionInstruction[] = [];

    const metaplex = new Metaplex(Data.connection);
    const nftMaker = await metaplex
        .nfts()
        .findByMint({ mintAddress: new PublicKey(Data.nftMintMaker) });
    console.log("nftMaker", nftMaker.creators);

    const nftTaker = await metaplex
        .nfts()
        .findByMint({ mintAddress: new PublicKey(Data.nftMintTaker) });
    console.log("nftTaker", nftTaker.creators);

    let takerAta = (
        await findOrCreateAta({
            connection: Data.connection,
            mint: Data.mintToken,
            owner: Data.taker,
            signer: Data.signer,
        })
    ).mintAta;

    let makerCreator = [Data.taker, Data.taker, Data.taker];
    let makerCreatorTokenAta = [takerAta, takerAta, takerAta];

    let takerCreator = makerCreator;
    let takerCreatorTokenAta = makerCreatorTokenAta;

    let mintAtaList: string[] = [];

    await Promise.all(
        nftMaker.creators.map(async (c, i) => {
            makerCreator[i] = c.address.toString();
            let ataData = await findOrCreateAta({
                connection: Data.connection,

                mint: Data.mintToken,
                owner: c.address.toString(),
                signer: Data.signer,
            });
            if (ataData.instruction && !mintAtaList.includes(ataData.mintAta.toString())) {
                instructions.push(ataData.instruction);
                mintAtaList.push(ataData.mintAta.toString());
            }
            makerCreatorTokenAta[i] = ataData.mintAta;
        })
    );
    console.log("makerCreator", makerCreator);
    console.log("makerCreatorTokenAta", makerCreatorTokenAta);

    // let takerI = 0;
    await Promise.all(
        nftTaker.creators.map(async (c, i) => {
            takerCreator[i] = c.address.toString();
            let ataData = await findOrCreateAta({
                connection: Data.connection,
                mint: Data.mintToken,
                owner: c.address.toString(),
                signer: Data.signer,
            });
            takerCreatorTokenAta[i] = ataData.mintAta;
            if (ataData.instruction && !mintAtaList.includes(ataData.mintAta.toString())) {
                instructions.push(ataData.instruction);
                mintAtaList.push(ataData.mintAta.toString());
            }
        })
    );
    console.log("takerCreator", takerCreator);
    console.log("takerCreatorTokenAta", takerCreatorTokenAta);
    return { instructions, makerCreator, takerCreator, makerCreatorTokenAta, takerCreatorTokenAta };
}
