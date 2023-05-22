const { PublicKey } = require("@solana/web3.js");
const { utils } = require("@project-serum/anchor");
const CONSTS = require("./const");
const { Metaplex } = require("@metaplex-foundation/js");

function findNftMasterEdition({ mint }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            CONSTS.TOKEN_METADATA_PROGRAM.toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
        ],
        CONSTS.TOKEN_METADATA_PROGRAM
    )[0];
}
module.exports = findNftMasterEdition;
