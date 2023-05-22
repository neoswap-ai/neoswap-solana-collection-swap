const { PublicKey } = require("@solana/web3.js");
const { utils } = require("@project-serum/anchor");
const CONSTS = require("./const");
const { Metaplex } = require("@metaplex-foundation/js");

async function findNftDataAndMetadataAccount({ connection, mint }) {
    // console.log(preSeed);
    try {
        const metaplex = new Metaplex(connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
        // console.log('nftData', nft);
        const AccountData = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), CONSTS.TOKEN_METADATA_PROGRAM.toBuffer(), mint.toBuffer()],
            CONSTS.TOKEN_METADATA_PROGRAM
        );
        return {
            tokenStandard: nft.tokenStandard,
            metadataAddress: nft.metadataAddress,
            metadataBump: AccountData[1],
        };
    } catch (error) {
        throw error;
    }
}
module.exports = findNftDataAndMetadataAccount;
