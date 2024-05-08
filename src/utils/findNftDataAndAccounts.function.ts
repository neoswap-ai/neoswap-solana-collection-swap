import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_METADATA_PROGRAM, METAPLEX_AUTH_RULES } from "./const";
import { ErrorFeedback } from "./types";
import { Metaplex } from "@metaplex-foundation/js";
// import { TOKEN_2022_PROGRAM_ID, getTokenMetadata } from "@solana/spl-token";
// import { TokenMetadata } from "@solana/spl-token`-metadata";
// import { DigitalAsset, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
// import { PublicKey as PPublicKey } from "@metaplex-foundation/umi-public-keys/dist/types/common";
// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { Umi } from "@metaplex-foundation/umi";
// import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export async function findNftDataAndMetadataAccount(Data: {
    connection: Connection;
    mint: string;
}): Promise<{
    tokenStandard?: number;
    metadataAddress: string;
    metadataBump: number;
}> {
    const { connection, mint } = Data;
    // let umi = createUmi(connection.rpcEndpoint);
    try {
        let nft = await getMetaFromMetaplex({ mint, connection });
        // console.log("nft", nft);
        let tokenStd = nft.tokenStandard;
        const AccountData = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                new PublicKey(TOKEN_METADATA_PROGRAM).toBuffer(),

                nft.mint.address.toBuffer(),
            ],
            new PublicKey(TOKEN_METADATA_PROGRAM)
        );
        if (tokenStd) {
            return {
                tokenStandard: tokenStd,

                metadataAddress: nft.metadataAddress.toString(),
                metadataBump: AccountData[1],
            };
        } else {
            return {
                metadataAddress: nft.metadataAddress.toString(),
                metadataBump: AccountData[1],
            };
        }
    } catch (error) {
        throw { blockchain: "solana", order: 0, status: "error", message: error } as ErrorFeedback;
    }
}
export function findNftMasterEdition(Data: { mint: string }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            new PublicKey(TOKEN_METADATA_PROGRAM).toBuffer(),
            new PublicKey(Data.mint).toBuffer(),
            Buffer.from("edition"),
        ],
        new PublicKey(TOKEN_METADATA_PROGRAM)
    )[0].toString();
}

export function findUserTokenRecord(Data: { mint: string; userMintAta: string }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            new PublicKey(TOKEN_METADATA_PROGRAM).toBuffer(),
            new PublicKey(Data.mint).toBuffer(),
            Buffer.from("token_record"),
            new PublicKey(Data.userMintAta).toBuffer(),
        ],
        new PublicKey(TOKEN_METADATA_PROGRAM)
    )[0].toString();
}

export async function findRuleSet(Data: { connection: Connection; mint: string }): Promise<string> {
    try {
        //@ts-ignore
        const metaplex = new Metaplex(Data.connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(Data.mint) });
        // console.log("nft", nft.programmableConfig.ruleSet);
        if (nft.programmableConfig?.ruleSet) {
            return nft.programmableConfig.ruleSet.toString();
        } else {
            return METAPLEX_AUTH_RULES.toString();
        }
    } catch (error) {
        throw { blockchain: "solana", order: 0, status: "error", message: error } as ErrorFeedback;
    }
}

async function getMetaFromMetaplex(Data: { mint: string; connection: Connection }) {
    let { mint } = Data;
    const metaplex = new Metaplex(Data.connection);

    return await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mint) });

    // return await fetchDigitalAsset(umi, mint as PPublicKey);
}
