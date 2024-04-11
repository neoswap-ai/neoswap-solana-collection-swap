import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { Metaplex } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getCreatorData(Data: {
    taker: string;
    signer: string;
    nftMintTaker: string;
    nftMintMaker: string;
    connection: Connection;
    paymentMint: string;
}) {
    let instructions: TransactionInstruction[] = [];

    let { mintAta: takerAta, tokenProgram } = await findOrCreateAta({
        connection: Data.connection,
        mint: Data.paymentMint,
        owner: Data.taker,
        signer: Data.signer,
    });

    let makerCreator = [Data.signer, Data.signer, Data.signer];
    let makerCreatorTokenAta = [takerAta, takerAta, takerAta];

    let takerCreator = [Data.signer, Data.signer, Data.signer];
    let takerCreatorTokenAta = [takerAta, takerAta, takerAta];

    if (!tokenProgram || tokenProgram === TOKEN_PROGRAM_ID.toString()) {
        const metaplex = new Metaplex(Data.connection);
        const nftMaker = await metaplex
            .nfts()
            .findByMint({ mintAddress: new PublicKey(Data.nftMintMaker) });
        console.log("nftMaker", nftMaker.creators);

        const nftTaker = await metaplex
            .nfts()
            .findByMint({ mintAddress: new PublicKey(Data.nftMintTaker) });
        console.log("nftTaker", nftTaker.creators);

        let mintAtaList: string[] = [];

        await Promise.all(
            nftMaker.creators.map(async (c, i) => {
                makerCreator[i] = c.address.toString();
                let ataData = await findOrCreateAta({
                    connection: Data.connection,

                    mint: Data.paymentMint,
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
                    mint: Data.paymentMint,
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
    }
    return {
        instructions,
        makerCreator,
        takerCreator,
        makerCreatorTokenAta,
        takerCreatorTokenAta,
        tokenProgram,
    };
}
