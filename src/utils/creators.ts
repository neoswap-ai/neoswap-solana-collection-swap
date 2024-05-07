import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { Metaplex } from "@metaplex-foundation/js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getCreatorData(Data: {
    owner: string;
    signer: string;
    nftMint: string;
    connection: Connection;
    paymentMint: string;
}) {
    let instructions: TransactionInstruction[] = [];
    let { connection, nftMint, owner, paymentMint, signer } = Data;
    let { mintAta: ownerAta, tokenProgram } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner,
        signer,
    });

    let creators = [signer, signer, signer];
    let creatorTokenAta = [ownerAta, ownerAta, ownerAta];

    if (tokenProgram && tokenProgram === TOKEN_2022_PROGRAM_ID.toString()) {
        console.log(
            tokenProgram,
            "tokenProgramtokenProgramtokenProgram",
            tokenProgram == TOKEN_PROGRAM_ID.toString()
                ? "native"
                : tokenProgram == TOKEN_2022_PROGRAM_ID.toString()
                ? "2022"
                : "inknown"
        );
        console.log("nftMint", nftMint);

        throw "tokenProgram not TOKEN_PROGRAM_ID in getCreatorData";
    }

    const metaplex = new Metaplex(connection);
    const nftData = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(nftMint) });
    console.log("nftMaker", nftData.creators);

    let mintAtaList: string[] = [];

    await Promise.all(
        nftData.creators.map(async (c, i) => {
            creators[i] = c.address.toString();
            let ataData = await findOrCreateAta({
                connection,
                mint: paymentMint,
                owner: c.address.toString(),
                signer,
            });
            if (ataData.instruction && !mintAtaList.includes(ataData.mintAta.toString())) {
                instructions.push(ataData.instruction);
                mintAtaList.push(ataData.mintAta.toString());
            }
            creatorTokenAta[i] = ataData.mintAta;
        })
    );
    console.log("creators", creators);
    console.log("creatorTokenAta", creatorTokenAta);
    return {
        instructions,
        creators,
        creatorTokenAta,
        tokenProgram,
    };
}
