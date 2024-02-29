import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { Metaplex } from "@metaplex-foundation/js";

export async function getCreatorData(Data: {
    taker: PublicKey;
    nftMintTaker: PublicKey;
    nftMintMaker: PublicKey;
    connection: Connection;
    paymentMint: PublicKey;
}) {
    let instructions: TransactionInstruction[] = [];

    const metaplex = new Metaplex(Data.connection);
    const nftMaker = await metaplex.nfts().findByMint({ mintAddress: Data.nftMintMaker });
    const tftMaker = await metaplex.nfts().findByMint({ mintAddress: Data.nftMintTaker });

    let takerAta = (
        await findOrCreateAta({
            connection: Data.connection,
            mint: Data.paymentMint,
            owner: Data.taker,
            signer: Data.taker,
        })
    ).mintAta;

    let makerCreator = [Data.taker, Data.taker, Data.taker];
    let makerCreatorTokenAta = [takerAta, takerAta, takerAta];

    let takerCreator = makerCreator;
    let takerCreatorTokenAta = makerCreatorTokenAta;

    let mintAtaList: string[] = [];

    await Promise.all(
        nftMaker.creators.map(async (c, i) => {
            if (c.verified) {
                makerCreator[i] = c.address;
                let ataData = await findOrCreateAta({
                    connection: Data.connection,

                    mint: Data.paymentMint,
                    owner: c.address,
                    signer: Data.taker,
                });
                if (
                    ataData.instruction &&
                    !!c.verified &&
                    !mintAtaList.includes(ataData.mintAta.toString())
                ) {
                    instructions.push(ataData.instruction);
                    mintAtaList.push(ataData.mintAta.toString());
                }
                makerCreatorTokenAta[i] = ataData.mintAta;
            }
        })
    );
    console.log(
        "makerCreator",
        makerCreator.map((m) => m.toBase58())
    );
    console.log(
        "makerCreatorTokenAta",
        makerCreatorTokenAta.map((m) => m.toBase58())
    );

    // let takerI = 0;
    await Promise.all(
        tftMaker.creators.map(async (c, i) => {
            if (c.verified) {
                takerCreator[i] = c.address;
                let ataData = await findOrCreateAta({
                    connection: Data.connection,
                    mint: Data.paymentMint,
                    owner: c.address,
                    signer: Data.taker,
                });
                takerCreatorTokenAta[i] = ataData.mintAta;
                if (ataData.instruction && !mintAtaList.includes(ataData.mintAta.toString())) {
                    instructions.push(ataData.instruction);
                    mintAtaList.push(ataData.mintAta.toString());
                }
            }
        })
    );
    return { instructions, makerCreator, takerCreator, makerCreatorTokenAta, takerCreatorTokenAta };
}
