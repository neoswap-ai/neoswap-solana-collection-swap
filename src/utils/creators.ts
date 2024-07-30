import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { Creator, Metaplex } from "@metaplex-foundation/js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { fetchAsset } from "@metaplex-foundation/mpl-core";
import { whichStandard } from "./findNftDataAndAccounts.function";

export async function getCreatorData({
    connection,
    nftMint,
    owner,
    paymentMint,
    signer,
    tokenStandard,
}: {
    owner: string;
    signer: string;
    nftMint: string;
    connection: Connection;
    paymentMint: string;
    tokenStandard?: "core" | "native" | "hybrid";
}) {
    let instructions: TransactionInstruction[] = [];
    // let { connection, nftMint, owner, paymentMint, signer } = Data;
    let { mintAta: ownerAta } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner,
        signer,
    });

    if (!tokenStandard) tokenStandard = await whichStandard({ connection, mint: nftMint });
    if (tokenStandard === "hybrid") {
        console.log(tokenStandard, "nftMint", nftMint);
        throw "not supported for hybrid nfts";
    }

    let creators = [signer, signer, signer, signer, signer];
    let creatorTokenAta = [ownerAta, ownerAta, ownerAta, ownerAta, ownerAta];
    let shares = [0, 0, 0, 0, 0];
    let creatorsList: { address: string; share: number }[] = [];

    if (tokenStandard === "native") {
        const metaplex = new Metaplex(connection);
        const nftData = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(nftMint) });
        creatorsList = nftData.creators.map((c) => {
            return { address: c.address.toString(), share: c.share };
        });
    } else {
        console.log(nftMint, "tokenStandard", tokenStandard);
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
            shares[i] = c.share;
        })
    );
    let display;
    console.log(
        "creators",
        creators
            .map((c, i) => {
                if (c == signer) return undefined;
                return { address: c, ata: creatorTokenAta[i], share: shares[i] };
            })
            .filter((c) => c)
    );
    return {
        instructions,
        creators,
        creatorTokenAta,
        tokenStandard,
        shares,
    };
}
