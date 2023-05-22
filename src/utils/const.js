const { PublicKey } = require("@solana/web3.js");
let CONSTS = {
    SWAP_PROGRAM_ID: new PublicKey("6kHx1ZDMaECRE14bEJB7mgP8NbsZHiVpSzNba2JgPq9N"),
    TOKEN_METADATA_PROGRAM: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
    METAPLEX_AUTH_RULES: new PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9"),
    METAPLEX_AUTH_RULES_PROGRAM: new PublicKey("auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg"),
};
module.exports = CONSTS;
