import { PublicKey } from "@solana/web3.js";
import { idlSwap } from "./neoSwap.idl";
export const NEOSWAP_PROGRAM_ID = new PublicKey("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH"); // mainnet
// export const NEOSWAP_PROGRAM_ID = new PublicKey("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY"); // local test
export const NEOSWAP_PROGRAM_ID_DEV = new PublicKey("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet"); // devnet  latest
// export const NEOSWAP_PROGRAM_ID = new PublicKey("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z"); // mainnet test
export const SOLANA_SPL_ATA_PROGRAM_ID = new PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
export const TOKEN_METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const METAPLEX_AUTH_RULES = new PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9");
export const METAPLEX_AUTH_RULES_PROGRAM = new PublicKey(
    "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg"
);

export const NEOSWAP_IDL = idlSwap;
