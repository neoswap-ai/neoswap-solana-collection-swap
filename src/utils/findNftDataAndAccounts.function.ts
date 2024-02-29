import { Cluster, Connection, PublicKey } from "@solana/web3.js";
import {
    TOKEN_METADATA_PROGRAM,
    METAPLEX_AUTH_RULES,
    NEOSWAP_PROGRAM_ID_DEV,
    NEOSWAP_PROGRAM_ID,
} from "./const";
import { ErrorFeedback } from "./types";
// import { Metaplex } from "@metaplex-foundation/js/dist/types/Metaplex";
import { Metaplex } from "@metaplex-foundation/js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
// const { Metaplex } = require("@metaplex-foundation/js");

export async function findNftDataAndMetadataAccount(Data: {
    connection: Connection;
    mint: PublicKey;
}): Promise<{
    tokenStandard?: number;
    metadataAddress: PublicKey;
    metadataBump: number;
}> {
    // console.log(preSeed);
    try {
        const metaplex = new Metaplex(Data.connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: Data.mint });
        // console.log("nftData", nft);
        let tokenStd = nft.tokenStandard;
        const AccountData = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM.toBuffer(),
                nft.mint.address.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM
        );
        if (tokenStd) {
            return {
                tokenStandard: tokenStd,
                metadataAddress: nft.metadataAddress,
                metadataBump: AccountData[1],
            };
        } else {
            return {
                metadataAddress: nft.metadataAddress,
                metadataBump: AccountData[1],
            };
        }
    } catch (error) {
        throw { blockchain: "solana", order: 0, status: "error", message: error } as ErrorFeedback;
    }
}

export function findNftMasterEdition(Data: { mint: PublicKey }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM.toBuffer(),
            Data.mint.toBuffer(),
            Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM
    )[0];
}

export function findUserTokenRecord(Data: { mint: PublicKey; userMintAta: PublicKey }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM.toBuffer(),
            Data.mint.toBuffer(),
            Buffer.from("token_record"),
            Data.userMintAta.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM
    )[0];
}

export async function findRuleSet(Data: {
    connection: Connection;
    mint: PublicKey;
}): Promise<PublicKey> {
    try {
        //@ts-ignore
        const metaplex = new Metaplex(Data.connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: Data.mint });
        // console.log("nft", nft.programmableConfig.ruleSet);
        if (nft.programmableConfig?.ruleSet) {
            return nft.programmableConfig.ruleSet;
        } else {
            return METAPLEX_AUTH_RULES;
        }
    } catch (error) {
        throw { blockchain: "solana", order: 0, status: "error", message: error } as ErrorFeedback;
    }
}

export function getCollectionPda(Data: {
    collection: PublicKey;
    cluster: Cluster;
    programId?: PublicKey;
}) {
    let pId = Data.cluster == "mainnet-beta" ? NEOSWAP_PROGRAM_ID : NEOSWAP_PROGRAM_ID_DEV;
    if (!!Data.programId) pId = Data.programId;
    return findProgramAddressSync([Data.collection.toBuffer()], pId)[0];
}

export function getAdminPda(cluster: Cluster, programId?: PublicKey) {
    let pId = cluster == "mainnet-beta" ? NEOSWAP_PROGRAM_ID : NEOSWAP_PROGRAM_ID_DEV;
    if (!!programId) pId = programId;
    return findProgramAddressSync([Buffer.from("admin")], pId)[0];
}
