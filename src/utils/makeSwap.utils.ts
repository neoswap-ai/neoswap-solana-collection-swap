import { BN } from "@coral-xyz/anchor";
import { makerFee } from "./fees";
import { findTraitBidAccount } from "./traitBid";
import { AssetStandard, Bid, CEnvOpts, TraitBid } from "./types";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  findNftDataAndMetadataAccount,
  findPnftAccounts,
  getCoreCollection,
} from "./findNftDataAndAccounts.function";
import { bidToscBid } from "./typeSwap";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { getCompNFTData } from "./compressedHelper";
import { SPL_ASSOCIATED_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { METAPLEX_AUTH_RULES_PROGRAM, TOKEN_METADATA_PROGRAM } from "./const";
import { createAddBidIx } from "../programInstructions/modifyAddBid.instructions";

export function getBidsForMake(bids: Bid[]) {
  let outBids = bids.sort((bidA, bidB) => {
    let amountA = makerFee({ bid: bidA });
    let amountB = makerFee({ bid: bidB });
    return amountB - amountA;
  });

  console.log("outBids", outBids);
  let firstBid = outBids[0];
  let otherBids = outBids.slice(1).length > 0 ? outBids.slice(1) : [];
  return { bids: outBids, firstBid, otherBids };
}

export async function getBidAccountInstructions({
  cEnvOpts,

  signer,
  traitBids,
}: {
  traitBids: TraitBid[];
  signer: string;
  cEnvOpts: CEnvOpts;
}) {
  let { program } = cEnvOpts;
  let instructions: TransactionInstruction[] = [];
  for await (let traitBid of traitBids) {
    let traitBidAccount = await findTraitBidAccount(traitBid.proofs, cEnvOpts);
    console.log("traitBidAccount", traitBidAccount);
    let createBidAccountIx = await program.methods
      .createBidAccount(traitBid.proofs.map((proof) => new PublicKey(proof)))
      .accountsStrict({
        bidAccount: traitBidAccount,
        signer,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    instructions.push(createBidAccountIx);
  }
  return instructions;
}

export async function createTraitBidSwapIx({
  cEnvOpts,
  tokenStd,
  nftMintMaker,
  connection,
  firstBid,
  endDate,
  maker,
  makerTokenAta,
  paymentMint,
  swapDataAccount,
  swapDataAccountTokenAta,
}: {
  traitBids: TraitBid[];
  signer: string;
  cEnvOpts: CEnvOpts;
  tokenStd: AssetStandard;
  nftMintMaker: string;
  connection: Connection;
  firstBid: Bid;
  endDate: number;
  maker: string;
  makerTokenAta: string;
  paymentMint: string;
  swapDataAccountTokenAta: string;
  swapDataAccount: string;
}) {
  let instructions: TransactionInstruction[] = [];
  let { program } = cEnvOpts;
  if (tokenStd === "core") {
    let coreCollection = await getCoreCollection({
      mint: nftMintMaker,
      connection,
    });
    const initIx = await program.methods
      .makeSwapCore(bidToscBid(firstBid), new BN(endDate))
      .accountsStrict({
        collection: coreCollection,
        maker,
        makerTokenAta,
        nftMintMaker,
        paymentMint,
        swapDataAccountTokenAta,
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        coreProgram: MPL_CORE_PROGRAM_ID.toString(),
        swapDataAccount,
        systemProgram: SystemProgram.programId.toString(),
      })
      .instruction();
    instructions.push(initIx);
  } else if (tokenStd === "compressed") {
    let {
      creatorHash,
      dataHash,
      index,
      merkleTree,
      nonce,
      proofMeta,
      root,
      treeAuthority,
    } = await getCompNFTData({
      cluster: cEnvOpts.cluster,
      tokenId: nftMintMaker,
      connection,
    });

    let makeCompData = await program.methods
      .makeSwapComp(
        bidToscBid(firstBid),
        new BN(endDate),
        Array.from(root),
        Array.from(dataHash),
        Array.from(creatorHash),
        nonce,
        index
      )
      .accountsStrict({
        swapDataAccount,
        swapDataAccountTokenAta,
        maker,
        makerTokenAta,
        tokenId: nftMintMaker,
        merkleTree,
        paymentMint,
        treeAuthority,
        ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
        bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        // sysvarInstructions: SYSVAR_INST/RUCTIONS_PUBKEY,
      })
      .remainingAccounts(proofMeta)
      .instruction();
    instructions.push(makeCompData);
  } else if (tokenStd === "native" || tokenStd === "hybrid") {
    let { mintAta: swapDataAccountNftAta, instruction: sn } =
      await findOrCreateAta({
        connection,
        mint: nftMintMaker,
        owner: swapDataAccount,
        signer: maker,
      });
    if (sn) instructions.push(sn);
    else console.log("swapDataAccountNftAta", swapDataAccountNftAta);

    let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
      connection,
      mint: nftMintMaker,
      owner: maker,
      signer: maker,
    });
    if (mn) instructions.push(mn);
    else console.log("makerNftAta", makerNftAta);

    if (tokenStd === "native") {
      let nftMasterEditionMaker: string | null = null;
      let ownerTokenRecordMaker: string | null = null;
      let destinationTokenRecordMaker: string | null = null;
      let authRulesMaker: string | null = null;

      const { metadataAddress: nftMetadataMaker, tokenStandard } =
        await findNftDataAndMetadataAccount({
          connection: program.provider.connection,
          mint: nftMintMaker,
        });
      if (tokenStandard == TokenStandard.ProgrammableNonFungible) {
        ({
          authRules: authRulesMaker,
          destinationTokenRecord: destinationTokenRecordMaker,
          masterEdition: nftMasterEditionMaker,
          ownerTokenRecord: ownerTokenRecordMaker,
        } = await findPnftAccounts({
          connection,
          destinationAta: swapDataAccountNftAta,
          mint: nftMintMaker,
          ownerAta: makerNftAta,
        }));
      }

      const initIx = await program.methods
        .makeSwap(bidToscBid(firstBid), new BN(endDate))
        .accountsStrict({
          swapDataAccount,
          swapDataAccountNftAta,
          swapDataAccountTokenAta,

          maker: maker,
          makerNftAta,
          makerTokenAta,

          nftMintMaker: nftMintMaker,
          paymentMint,

          nftMetadataMaker,
          nftMasterEditionMaker,
          ownerTokenRecordMaker,
          destinationTokenRecordMaker,
          authRulesMaker,

          systemProgram: SystemProgram.programId,
          metadataProgram: TOKEN_METADATA_PROGRAM,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
          authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
        })
        .instruction();
      instructions.push(initIx);
    } else if (tokenStd === "hybrid") {
      const initIx = await program.methods
        .makeSwap22(bidToscBid(firstBid), new BN(endDate))
        .accountsStrict({
          swapDataAccount,
          swapDataAccountNftAta,
          swapDataAccountTokenAta,

          maker: maker,
          makerNftAta,
          makerTokenAta,

          nftMintMaker: nftMintMaker,
          paymentMint,

          systemProgram: SystemProgram.programId,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenProgram22: TOKEN_2022_PROGRAM_ID,
          ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
      instructions.push(initIx);
    } else throw "not supported";
  } else throw "token not supported";
  return instructions;
}

export async function createAdditionalTraitSwapBidIx({
  otherBids,
  maker,
  makerTokenAta,
  paymentMint,
  swapDataAccount,
  swapDataAccountTokenAta,
  cEnvOpts,
}: {
  otherBids: Bid[];
  swapDataAccount: string;
  maker: string;
  paymentMint: string;
  makerTokenAta: string;
  swapDataAccountTokenAta: string;
  cEnvOpts: CEnvOpts;
}) {
  let makeBidIxs: TransactionInstruction[] = [];
  let addBidIxs: TransactionInstruction[] = [];
  let firstBids: Bid[] = [];

  if (otherBids.length > 0) {
    ({ ataIxs: makeBidIxs, bidIxs: addBidIxs } = await createAddBidIx({
      swapDataAccount,
      bids: otherBids,
      maker,
      paymentMint,
      makerTokenAta,
      swapDataAccountTokenAta,
      ...cEnvOpts,
    }));
    if (addBidIxs.length <= 3) {
      makeBidIxs.push(...addBidIxs);
      addBidIxs = [];
      firstBids = otherBids;
    } else {
      makeBidIxs.push(...addBidIxs.slice(0, 3));
      addBidIxs = addBidIxs.slice(3);
      firstBids = otherBids.slice(0, 3);
      otherBids = otherBids.slice(3);
    }
  }
  return { makeBidIxs, addBidIxs, firstBids, otherBids };
}
