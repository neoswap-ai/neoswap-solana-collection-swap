const { PublicKey } = require("@solana/web3.js");
const { utils } = require("@project-serum/anchor");
const CONSTS = require("./const");
const { Metaplex } = require("@metaplex-foundation/js");

function findUserTokenRecord({ mint, userMintAta }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            CONSTS.TOKEN_METADATA_PROGRAM.toBuffer(),
            mint.toBuffer(),
            Buffer.from("token_record"),
            userMintAta.toBuffer(),
        ],
        CONSTS.TOKEN_METADATA_PROGRAM
    )[0];
}
module.exports = findUserTokenRecord;
