import { PublicKey } from "@solana/web3.js";
import { keccak_256 } from "js-sha3";
import { EnvOpts, SwapType } from "./types";
import { checkEnvOpts } from "./check";
import bs58 from "bs58";
import crypto from "crypto";

export async function findTraitBidAccount(proofs: string[], maker: string, envOpts: EnvOpts) {
  //   let fullproof = proofs.map((proof) => {
  //     let prooof = new Uint8Array(new PublicKey(proof).toBuffer());
  //     console.log(prooof, "proofproofproofproofproof");
  //     return prooof;
  //   });

  //   let seeds = Uint8Array.from(keccak_256.digest(Buffer.concat(fullproof)));
  //   console.log(fullproof, "seedsseedsseedsseedsseeds", seeds);

  // Decode proofs and concatenate
  const decodedProofs = proofs.map((proof) => bs58.decode(proof));
  const concatenatedProofs = Buffer.concat(decodedProofs);

  // Create SHA-256 hash
  const hasher = crypto.createHash("sha256");
  hasher.update(concatenatedProofs);
  const seeds = hasher.digest();

  let cEnvOpts = await checkEnvOpts(envOpts);
  let bidAccount = PublicKey.findProgramAddressSync(
    [seeds, new PublicKey(maker).toBytes()],
    new PublicKey(cEnvOpts.programId)
  )[0].toString();
  console.log(bidAccount, " - bidAccountbidAccountbidAccountbidAccount");
  return bidAccount;
}

export function isTraitToTraitStandart(isTraits: boolean) {
  return isTraits ? SwapType.traits : SwapType.native;
}
