const { PublicKey } = require("@solana/web3.js");
const { utils } = require("@project-serum/anchor");
const CONSTS = require("./const");
const { Metaplex } = require("@metaplex-foundation/js");

async function findNftMasterEdition({ connection, mint }) {
    const metaplex = new Metaplex(connection);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
    // console.log("nft", nft.programmableConfig.ruleSet);
    if (nft.programmableConfig.ruleSet) {
        return nft.programmableConfig.ruleSet;
    } else {
        return CONSTS.METAPLEX_AUTH_RULES;
    }
}
module.exports = findNftMasterEdition;
