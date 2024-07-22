import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { Creator, Metaplex } from "@metaplex-foundation/js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { fetchAsset } from "@metaplex-foundation/mpl-core";

export async function getCreatorData({
    connection,
    isCore,
    nftMint,
    owner,
    paymentMint,
    signer,
}: {
    owner: string;
    signer: string;
    nftMint: string;
    connection: Connection;
    paymentMint: string;
    isCore: boolean;
}) {
    let instructions: TransactionInstruction[] = [];
    // let { connection, nftMint, owner, paymentMint, signer } = Data;
    let { mintAta: ownerAta, tokenProgram } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner,
        signer,
    });

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

    let creators = [signer, signer, signer, signer, signer];
    let creatorTokenAta = [ownerAta, ownerAta, ownerAta, ownerAta, ownerAta];
    let creatorsList: { address: string; share: number }[] = [];
    if (!isCore) {
        const metaplex = new Metaplex(connection);
        const nftData = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(nftMint) });
        console.log("nftMaker", nftData.creators);
        creatorsList = nftData.creators.map((c) => {
            return { address: c.address.toString(), share: c.share };
        });
    } else {
        let umi = createUmi(connection.rpcEndpoint).use(dasApi());

        const coreCollectionData = await fetchAsset(umi, nftMint);

        if (coreCollectionData.royalties) {
            creatorsList = coreCollectionData.royalties.creators.map((c) => {
                return { address: c.address, share: c.percentage };
            });
        }
    }
    let mintAtaList: string[] = [];

    await Promise.all(
        creatorsList.map(async (c, i) => {
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
    console.log("instructions", instructions.length);
    return {
        instructions,
        creators,
        creatorTokenAta,
        tokenProgram,
    };
}
