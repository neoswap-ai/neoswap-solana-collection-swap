import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_METADATA_PROGRAM, METAPLEX_AUTH_RULES } from "./const";
import { ErrorFeedback } from "./types";
import { Metaplex } from "@metaplex-foundation/js";

export async function findNftDataAndMetadataAccount(Data: {
    connection: Connection;
    mint: string;
}): Promise<{
    tokenStandard?: number;
    metadataAddress: string;
    metadataBump: number;
}> {
    // console.log(preSeed);
    try {
        let tokenOwner = (await Data.connection.getAccountInfo(new PublicKey(Data.mint)))?.owner;
        console.log("tokenOwner", tokenOwner?.toBase58());

        const metaplex = new Metaplex(Data.connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(Data.mint) });
        // console.log("nftData", nft);
        let tokenStd = nft.tokenStandard;
        const AccountData = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                new PublicKey(TOKEN_METADATA_PROGRAM).toBuffer(),
                nft.mint.address.toBuffer(),
            ],
            new PublicKey(TOKEN_METADATA_PROGRAM)
        );
        console.log("AccountData", AccountData);

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
