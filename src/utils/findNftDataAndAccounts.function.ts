import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_METADATA_PROGRAM, METAPLEX_AUTH_RULES, FAIR_LAUNCH_PROGRAM_ID } from "./const";
import { ErrorFeedback } from "./types";
import { Metaplex } from "@metaplex-foundation/js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { fetchAsset, MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";

// import { TOKEN_2022_PROGRAM_ID, getTokenMetadata } from "@solana/spl-token";
// import { TokenMetadata } from "@solana/spl-token`-metadata";
// import { DigitalAsset, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
// import { PublicKey as PPublicKey } from "@metaplex-foundation/umi-public-keys/dist/types/common";
// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { Umi } from "@metaplex-foundation/umi";
// import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export async function findPnftAccounts({
    ownerAta,
    connection,
    mint,
    destinationAta,
}: {
    connection: Connection;
    mint: string;
    ownerAta: string;
    destinationAta: string;
}) {
    let [masterEdition, ownerTokenRecord, destinationTokenRecord, authRules] = await Promise.all([
        findNftMasterEdition({
            mint,
        }),
        findUserTokenRecord({
            mint,
            userMintAta: ownerAta,
        }),
        findUserTokenRecord({
            mint,
            userMintAta: destinationAta,
        }),
        await findRuleSet({
            connection,
            mint,
        }),
    ]);
    return {
        masterEdition,
        ownerTokenRecord,
        destinationTokenRecord,
        authRules,
    };
}
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
export function standardToProgram(standard: "core" | "native" | "hybrid" | "compressed") {
    switch (standard) {
        case "core":
            return MPL_CORE_PROGRAM_ID.toString();
        case "native":
            return TOKEN_PROGRAM_ID.toString();
        case "hybrid":
            return TOKEN_2022_PROGRAM_ID.toString();
        case "compressed":
            throw "compressed does't have a program";
    }
}
export async function whichStandard({
    connection,
    mint,
}: {
    connection: Connection;
    mint: string;
}): Promise<"core" | "native" | "hybrid" | "compressed"> {
    let tokenProg = (await connection.getAccountInfo(new PublicKey(mint)))?.owner.toString();

    switch (tokenProg) {
        case TOKEN_PROGRAM_ID.toString():
            return "native";
        case TOKEN_2022_PROGRAM_ID.toString():
            return "hybrid";
        case MPL_CORE_PROGRAM_ID.toString():
            return "core";
        default:
            let balance = await connection.getBalance(new PublicKey(mint));

            if (balance === 0) return "compressed";
            else throw `Token standard not supported for mint ${mint}`;
    }
}

export async function getCoreCollection({
    connection,
    mint,
}: {
    connection: Connection;
    mint: string;
}): Promise<string> {
    let umi = createUmi(connection.rpcEndpoint).use(dasApi());

    const coreCollectionData = await fetchAsset(umi, mint);

    if (
        coreCollectionData.updateAuthority.type == "Collection" &&
        !!coreCollectionData.updateAuthority.address
    ) {
        return coreCollectionData.updateAuthority.address!;
    } else throw "No core collection found";
}

export async function getHashlistMarker({
    collection,
    nftMintTaker,
}: {
    collection: string;
    nftMintTaker: string;
}) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("hashlist_marker"),
            new PublicKey(collection).toBuffer(),
            new PublicKey(nftMintTaker).toBuffer(),
        ],
        new PublicKey(FAIR_LAUNCH_PROGRAM_ID)
    )[0].toString();
}
