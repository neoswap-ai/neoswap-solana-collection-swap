import { BN } from "@coral-xyz/anchor";
import { AssetStandard, Bid, BTv, CEnvOpts, SwapData, TakeSArg } from "./types";
import { bidToscBid } from "./typeSwap";
import {
  findNftDataAndMetadataAccount,
  findPnftAccounts,
  getCoreCollection,
  getHashlistMarker,
} from "./findNftDataAndAccounts.function";
import {
  Cluster,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SPL_ASSOCIATED_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { METAPLEX_AUTH_RULES_PROGRAM, NS_FEE, TOKEN_METADATA_PROGRAM } from "./const";
import { getCompNFTData } from "./compressedHelper";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { DESC } from "./descriptions";
import { appendToBT, ix2vTx } from "./vtx";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol, closeWSol } from "./wsol";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { findOrCreateAta } from "./findOrCreateAta.function";
import { getCreatorData } from "./creators";

export async function createTakeSwapIxs({
  traitIndex,
  traitProofs,
  taker,
  takerAmount,
  takerTokenAta,
  swapDataData,
  takerNftStd,
  nftMintTaker,
  connection,
  swapDataAccount,
  swapDataAccountTokenAta,
  cEnvOpts,
  bid,
  n,
  bidAccount: givemBidAccount,
  maker,
  makerTokenAta,
  signer,
  tokenStandardTaker,
  nftMetadataTaker,
}: {
  traitIndex?: number;
  traitProofs?: string[];
  taker: string;
  takerTokenAta: string;
  takerAmount: number;
  swapDataData: SwapData;
  takerNftStd: AssetStandard;
  nftMintTaker: string;
  connection: Connection;
  swapDataAccount: string;
  swapDataAccountTokenAta: string;
  cEnvOpts: CEnvOpts;
  bid: Bid;
  n: number;
  bidAccount?: string;
  maker: string;
  makerTokenAta: string;
  tokenStandardTaker?: TokenStandard;
  signer: string;
  nftMetadataTaker?: string;
}) {
  let { program } = cEnvOpts;

  let takeIxs: TransactionInstruction[] = [];

  let traitsProofPk: PublicKey[] = [];
  let traitInd: number | null = null;
  let bidAccount = givemBidAccount ?? null;
  console.log("traitIndex && traitProofs", traitIndex, traitProofs);

  if (traitIndex !== undefined && traitProofs !== undefined && traitProofs.length > 0) {
    traitInd = traitIndex;
    traitsProofPk = traitProofs.map((proof) => new PublicKey(proof));
  }

  if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
    if (takerAmount > 0) takeIxs.push(...addWSol(taker, takerTokenAta, takerAmount));
  }
  if (takerNftStd == "core") {
    let takerCoreCollection = await getCoreCollection({
      connection,
      mint: nftMintTaker,
    });
    const takeIx = await program.methods
      .takeSwapCore(bidToscBid(bid), n, traitInd, traitsProofPk)
      .accountsStrict({
        swapDataAccount,
        swapDataAccountTokenAta,

        bidAccount,

        maker,
        makerTokenAta,

        taker,
        takerTokenAta,

        nftMintTaker,
        // paymentMint,

        collection: takerCoreCollection,

        coreProgram: MPL_CORE_PROGRAM_ID,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    takeIxs.push(takeIx);
  } else if (takerNftStd === "compressed") {
    let cluster = (
      !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
    ) as Cluster;
    let {
      creatorHash,
      dataHash,
      index,
      merkleTree,
      nonce,
      proofMeta,
      root,
      treeAuthority,
      collection,
      metadata,
    } = await getCompNFTData({
      cluster,
      tokenId: nftMintTaker,
      connection,
    });
    if (!metadata) throw "Compressed no metadata found";
    if (metadata.collection == null) throw "Compressed no collection found";
    if (traitInd !== null && traitProofs !== undefined && traitsProofPk.length > 0 && bidAccount) {
      let takeIx = await program.methods
        .takeSwapCompTraits(
          new BN(takerAmount),
          Array.from(root),
          Array.from(dataHash),
          Array.from(creatorHash),
          nonce,
          index,
          traitInd,
          traitsProofPk,
          n
        )
        .accountsStrict({
          swapDataAccount,
          swapDataAccountTokenAta,

          bidAccount,

          maker,
          makerTokenAta,
          // tokenId: nftMintMaker,
          merkleTree,
          // paymentMint,
          treeAuthority,
          // collection,
          // nftMintTaker,
          taker,
          takerTokenAta,
          // ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
          bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .remainingAccounts(proofMeta)
        .instruction();
      takeIxs.push(takeIx);
    } else {
      let takeIx = await program.methods
        .takeSwapComp(
          // bidToscBid(bid),
          // bidToscBid(bid).collection,
          metadata.collection,
          new BN(takerAmount),
          Array.from(root),
          // Array.from(dataHash),
          // Array.from(creatorHash),
          metadata.name,
          metadata.symbol,
          metadata.uri,
          metadata.sellerFeeBasisPoints,
          metadata.primarySaleHappened,
          metadata.isMutable,
          metadata.editionNonce,
          metadata.creators,
          // (metadata.creators.map((c) => c.address)),
          // (metadata.creators.map((c) => c.verified)),
          // Buffer.from(metadata.creators.map((c) => c.share)),
          nonce,
          index,
          n
        )
        .accountsStrict({
          swapDataAccount,
          swapDataAccountTokenAta,
          maker,
          makerTokenAta,
          // tokenId: nftMintMaker,
          merkleTree,
          // paymentMint,
          treeAuthority,
          // collection,
          // nftMintTaker,
          taker,
          takerTokenAta,
          // ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
          bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .remainingAccounts(proofMeta)
        .instruction();
      takeIxs.push(takeIx);
    }
  } else {
    let { mintAta: makerNftAta, instruction: makerAtaMakerNftIx } = await findOrCreateAta({
      connection,
      mint: nftMintTaker,
      owner: maker,
      signer,
    });
    if (makerAtaMakerNftIx) takeIxs.push(makerAtaMakerNftIx);
    else console.log("makerNftAta", makerNftAta);

    let { mintAta: takerNftAta, instruction: takerAtaMakerNftIx } = await findOrCreateAta({
      connection,
      mint: nftMintTaker,
      owner: taker,
      signer,
    });
    if (takerAtaMakerNftIx) takeIxs.push(takerAtaMakerNftIx);
    else console.log("takerNftAta", takerNftAta);

    if (takerNftStd === "native") {
      let nftMasterEditionTaker: string | null = null;
      let ownerTokenRecordTaker: string | null = null;
      let destinationTokenRecordTaker: string | null = null;
      let authRulesTaker: string | null = null;

      if (tokenStandardTaker == TokenStandard.ProgrammableNonFungible) {
        ({
          authRules: authRulesTaker,
          destinationTokenRecord: destinationTokenRecordTaker,
          masterEdition: nftMasterEditionTaker,
          ownerTokenRecord: ownerTokenRecordTaker,
        } = await findPnftAccounts({
          connection,
          destinationAta: makerNftAta,
          mint: nftMintTaker,
          ownerAta: takerNftAta,
        }));
      }

      if (!nftMetadataTaker)
        nftMetadataTaker = (
          await findNftDataAndMetadataAccount({
            connection,
            mint: nftMintTaker,
          })
        ).metadataAddress;

      const takeIx = await program.methods
        .takeSwap(bidToscBid(bid), n, traitInd, traitsProofPk)
        .accountsStrict({
          swapDataAccount,
          swapDataAccountTokenAta,

          bidAccount,

          maker,
          makerNftAta,
          makerTokenAta,

          taker,
          takerNftAta,
          takerTokenAta,

          nftMintTaker,
          // paymentMint,

          nftMetadataTaker,
          nftMasterEditionTaker,
          ownerTokenRecordTaker,
          destinationTokenRecordTaker,
          authRulesTaker,

          systemProgram: SystemProgram.programId.toString(),
          metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
          tokenProgram: TOKEN_PROGRAM_ID.toString(),
          ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
          authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM.toString(),
        })
        // .remainingAccounts(traitsMeta)
        .instruction();
      takeIxs.push(takeIx);
    } else {
      let makerhashlistMarker = await getHashlistMarker({
        collection: bid.collection,
        nftMintTaker,
      });
      console.log("makerhashlistMarker", makerhashlistMarker);

      const takeIx = await program.methods
        .takeSwap22(bidToscBid(bid), n, traitInd, traitsProofPk)
        .accountsStrict({
          swapDataAccount,
          swapDataAccountTokenAta,

          bidAccount,

          maker,
          makerNftAta,
          makerTokenAta,

          taker,
          takerNftAta,
          takerTokenAta,

          nftMintTaker,
          // paymentMint,

          hashlistMarker: makerhashlistMarker,

          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenProgram22: TOKEN_2022_PROGRAM_ID,
          ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
      takeIxs.push(takeIx);
    }
  }
  return { takeIxs, nftMetadataTaker };
}

export async function createClaimSwapIxs({
  cEnvOpts,
  connection,
  maker,
  makerNftStd,
  makerTokenAta,
  nftMintMaker,
  nsFeeTokenAta,
  signer,
  swapDataAccount,
  swapDataAccountTokenAta,
  taker,
  takerTokenAta,
  tokenStandardMaker,
  nftMetadataMaker,
}: {
  connection: Connection;
  cEnvOpts: CEnvOpts;
  makerNftStd: AssetStandard;
  nftMintMaker: string;
  nsFeeTokenAta: string;
  signer: string;
  taker: string;
  takerTokenAta: string;
  maker: string;
  makerTokenAta: string;
  swapDataAccountTokenAta: string;
  swapDataAccount: string;
  nftMetadataMaker?: string;
  tokenStandardMaker?: TokenStandard;
}) {
  let { program } = cEnvOpts;
  let claimIxs: TransactionInstruction[] = [];

  if (makerNftStd === "core") {
    let coreCollection = await getCoreCollection({
      mint: nftMintMaker,
      connection,
    });
    const claimCoreIx = await program.methods
      .claimSwapCore()
      .accountsStrict({
        ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
        nsFee: NS_FEE,
        nsFeeTokenAta,
        signer,
        taker,
        takerTokenAta,
        collection: coreCollection,
        maker,
        makerTokenAta,
        nftMintMaker,
        // paymentMint,
        swapDataAccountTokenAta,
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        coreProgram: MPL_CORE_PROGRAM_ID.toString(),
        swapDataAccount,
        systemProgram: SystemProgram.programId.toString(),
      })
      .instruction();
    claimIxs.push(claimCoreIx);
  } else if (makerNftStd === "compressed") {
    let cluster = (cEnvOpts.clusterOrUrl.includes("devnet") ? "devnet" : "mainnet-beta") as Cluster;
    let {
      creatorHash,
      dataHash,
      index,
      merkleTree,
      nonce,
      proofMeta,
      root,
      treeAuthority,
      collection,
      metadata,
    } = await getCompNFTData({
      cluster,
      tokenId: nftMintMaker,
      connection,
    });
    // console.log("was claim makerNFT");

    if (!metadata) throw "Compressed no metadata found";
    if (metadata.collection == null) throw "Compressed no collection found";

    let claimCompIx = await program.methods
      .claimSwapComp(Array.from(creatorHash), Array.from(dataHash), Array.from(root), nonce, index)
      .accountsStrict({
        swapDataAccount,
        swapDataAccountTokenAta,
        signer,

        maker,
        makerTokenAta,
        // tokenId: nftMintMaker,
        merkleTree,
        // paymentMint,
        treeAuthority,
        // collection,
        // nftMintTaker,
        taker,
        takerTokenAta,

        nsFee: NS_FEE,
        nsFeeTokenAta,

        ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
        bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .remainingAccounts(proofMeta)
      .instruction();
    claimIxs.push(claimCompIx);
  } else {
    // if (sdaAtaMakerNftIx) claimIxs.push(sdaAtaMakerNftIx);
    // else console.log("swapDataAccountNftAta", swapDataAccountNftAta);
    let { mintAta: swapDataAccountNftAta, instruction: sdaAtaMakerNftIx } = await findOrCreateAta({
      connection,
      mint: nftMintMaker,
      owner: swapDataAccount,
      signer,
    });

    let { mintAta: takerNftAtaMaker, instruction: takerAtaMakerNftIx } = await findOrCreateAta({
      connection,
      mint: nftMintMaker,
      owner: taker,
      signer,
    });
    if (takerAtaMakerNftIx) claimIxs.push(takerAtaMakerNftIx);
    else console.log("takerNftAta", takerNftAtaMaker);

    if (makerNftStd === "native") {
      let nftMasterEditionMaker: string | null = null;
      let ownerTokenRecordMaker: string | null = null;
      let destinationTokenRecordMaker: string | null = null;
      let authRulesMaker: string | null = null;

      if (tokenStandardMaker == TokenStandard.ProgrammableNonFungible) {
        ({
          authRules: authRulesMaker,
          destinationTokenRecord: destinationTokenRecordMaker,
          masterEdition: nftMasterEditionMaker,
          ownerTokenRecord: ownerTokenRecordMaker,
        } = await findPnftAccounts({
          connection,
          destinationAta: takerNftAtaMaker,
          mint: nftMintMaker,
          ownerAta: swapDataAccountNftAta,
        }));
      }
      if (!nftMetadataMaker)
        nftMetadataMaker = (
          await findNftDataAndMetadataAccount({
            connection,
            mint: nftMintMaker,
          })
        ).metadataAddress;

      const claimIx = await program.methods
        .claimSwap()
        .accountsStrict({
          swapDataAccount,
          swapDataAccountNftAta,
          swapDataAccountTokenAta,

          nsFee: NS_FEE,
          nsFeeTokenAta,

          signer,

          taker,
          takerNftAtaMaker,
          takerTokenAta,

          maker,
          makerTokenAta,

          nftMintMaker,
          // paymentMint,

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

      claimIxs.push(claimIx);
    } else {
      // console.log("signer", signer);
      // console.log("taker", taker);

      const claimIx = await program.methods
        .claimSwap22()
        .accountsStrict({
          swapDataAccount,
          swapDataAccountNftAta,
          swapDataAccountTokenAta,

          nsFee: NS_FEE,
          nsFeeTokenAta,

          signer,

          taker,
          takerNftAtaMaker,
          takerTokenAta,

          maker,
          makerTokenAta,

          nftMintMaker,
          // paymentMint,

          systemProgram: SystemProgram.programId,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenProgram22: TOKEN_2022_PROGRAM_ID,
          ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();

      claimIxs.push(claimIx);
    }
  }
  return { claimIxs, nftMetadataMaker };
}

export async function createPayRoyaltiesIxs({
  tokenStandard,
  connection,
  cEnvOpts,
  nftMint,
  paymentMint,
  signer,
  swapDataAccount,
  swapDataAccountTokenAta,
  payer,
  nftCurrentOwner,
  nftMetadata,
}: {
  connection: Connection;
  tokenStandard: AssetStandard;
  cEnvOpts: CEnvOpts;

  nftMint: string;
  swapDataAccount: string;
  swapDataAccountTokenAta: string;
  paymentMint: string;
  payer: string;
  signer: string;
  nftCurrentOwner: string;
  nftMetadata?: string;
}) {
  let { program } = cEnvOpts;
  let payRTakerIxs: TransactionInstruction[] = [];
  console.log("royaltiesPaidTaker", tokenStandard);
  if (tokenStandard === "core") {
    let {
      creators,
      creatorTokenAta,
      instructions: creatorIxs,
    } = await getCreatorData({
      connection,
      nftMint,
      owner: nftCurrentOwner,
      paymentMint,
      signer,
      tokenStandard,
    });
    let payTakerCoreIx = await program.methods
      .payRoyaltiesCore()
      .accountsStrict({
        swapDataAccount,
        swapDataAccountTokenAta,
        nftMint,
        // paymentMint,
        signer,
        // nsFee: NS_FEE,
        // nsFeeTokenAta,
        creator0: creators[0],
        creator0TokenAta: creatorTokenAta[0],
        creator1: creators[1],
        creator1TokenAta: creatorTokenAta[1],
        creator2: creators[2],
        creator2TokenAta: creatorTokenAta[2],
        creator3: creators[3],
        creator3TokenAta: creatorTokenAta[3],
        creator4: creators[4],
        creator4TokenAta: creatorTokenAta[4],
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    payRTakerIxs.push(...creatorIxs);
    payRTakerIxs.push(payTakerCoreIx);
  } else if (tokenStandard === "compressed") {
    let {
      creators: creators,
      creatorTokenAta: creatorTokenAta,
      instructions: creatorIxs,
    } = await getCreatorData({
      connection,
      nftMint,
      owner: nftCurrentOwner,
      paymentMint,
      signer,
      tokenStandard,
    });
    // console.log("was pay royalties taker", creators, creatorTokenAta);

    let cluster = (
      !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
    ) as Cluster;
    let { index, merkleTree, nonce, proofMeta, root, metadata, owner } = await getCompNFTData({
      cluster,
      tokenId: nftMint,
      connection,
      getRootHash: "calculate",
      newOwner: payer,
    });
    if (!metadata) throw "Compressed no metadata found";
    if (metadata.collection == null) throw "Compressed no collection found";

    let payTakerCoreIx = await program.methods
      .payRoyaltiesComp(
        root,
        metadata.name,
        metadata.symbol,
        metadata.uri,
        metadata.sellerFeeBasisPoints,
        metadata.primarySaleHappened,
        metadata.isMutable,
        metadata.editionNonce,
        metadata.creators,
        metadata.collection,
        nonce,
        index
      )
      .accountsStrict({
        swapDataAccount,
        swapDataAccountTokenAta,
        // nftMint: nftMintPayer,

        // paymentMint,
        merkleTree,
        owner,
        signer,
        // nsFee: NS_FEE,
        // nsFeeTokenAta,
        creator0: creators[0],
        creator0TokenAta: creatorTokenAta[0],
        creator1: creators[1],
        creator1TokenAta: creatorTokenAta[1],
        creator2: creators[2],
        creator2TokenAta: creatorTokenAta[2],
        creator3: creators[3],
        creator3TokenAta: creatorTokenAta[3],
        creator4: creators[4],
        creator4TokenAta: creatorTokenAta[4],
        tokenProgram: TOKEN_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .remainingAccounts(proofMeta)
      .instruction();
    payRTakerIxs.push(...creatorIxs);
    payRTakerIxs.push(payTakerCoreIx);
  } else if (tokenStandard === "native") {
    let {
      creators: payerCreator,
      creatorTokenAta: creatorTokenAta,
      instructions: creatorIxs,
    } = await getCreatorData({
      connection,
      nftMint,
      paymentMint,
      owner: swapDataAccount,
      signer,
      tokenStandard,
    });

    if (creatorIxs.length > 0) {
      console.log("creatorIxs added", creatorIxs.length);
      payRTakerIxs.push(...creatorIxs);
    }

    if (!nftMetadata)
      nftMetadata = (
        await findNftDataAndMetadataAccount({
          connection,
          mint: nftMint,
        })
      ).metadataAddress;

    const payRIx = await program.methods
      .payRoyalties()
      .accountsStrict({
        swapDataAccount,
        swapDataAccountTokenAta,

        signer,

        nftMetadata,
        nftMint,

        metadataProgram: TOKEN_METADATA_PROGRAM,
        tokenProgram: TOKEN_PROGRAM_ID.toString(),

        creator0: payerCreator[0],
        creator0TokenAta: creatorTokenAta[0],
        creator1: payerCreator[1],
        creator1TokenAta: creatorTokenAta[1],
        creator2: payerCreator[2],
        creator2TokenAta: creatorTokenAta[2],
        creator3: payerCreator[3],
        creator3TokenAta: creatorTokenAta[3],
        creator4: payerCreator[4],
        creator4TokenAta: creatorTokenAta[4],
      })
      .instruction();
    payRTakerIxs.push(payRIx);
    // console.log("payRIx", payRIx);
  } else {
    const payRIx = await program.methods
      .payRoyalties22()
      .accountsStrict({
        swapDataAccount,
        nftMint,

        signer,

        tokenProgram22: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();
    payRTakerIxs.push(payRIx);
  }
  return { payRTakerIxs, nftMetadata };
}

export async function parseTakeAndCloseTxs({
  cEnvOpts,
  claimIxs,
  closeSIxs,
  payRMakerIxs,
  payRTakerIxs,
  signer,
  takeIxs,
  acceptedBid,
  claimed,
  royaltiesPaidMaker,
  royaltiesPaidTaker,
  takeArgs,
  connection,
  makerNftStd,
  takerNftStd,
}: {
  acceptedBid?: Bid;
  claimed?: boolean;
  royaltiesPaidMaker?: boolean;
  royaltiesPaidTaker?: boolean;
  makerNftStd: AssetStandard;
  takerNftStd: AssetStandard;
  takeIxs: TransactionInstruction[];
  claimIxs: TransactionInstruction[];
  payRMakerIxs: TransactionInstruction[];
  payRTakerIxs: TransactionInstruction[];
  closeSIxs: TransactionInstruction[];
  cEnvOpts: CEnvOpts;
  signer: string;
  takeArgs: TakeSArg;
  connection: Connection;
}) {
  let BT: BTv[] = [];

  if (makerNftStd === "compressed" || takerNftStd === "compressed") {
    console.log("not clump");
    if (!acceptedBid) {
      BT.push(
        appendToBT({
          BT,
          tx: await ix2vTx(takeIxs, cEnvOpts, signer),
          description: DESC.takeSwap,
          details: takeArgs,
        })
      );
    }
    if (!claimed) {
      BT.push(
        appendToBT({
          BT,
          tx: await ix2vTx(claimIxs, cEnvOpts, signer),
          description: DESC.claimSwap,
          details: takeArgs,
        })
      );
    }

    if (makerNftStd !== "compressed") {
      if (!royaltiesPaidMaker) {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(payRMakerIxs, cEnvOpts, signer),
            description: DESC.payRoyalties,
            details: takeArgs,
          })
        );
      }
      if (!royaltiesPaidTaker) {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(payRTakerIxs.concat(closeSIxs), cEnvOpts, signer),
            description: DESC.close,
            details: takeArgs,
          })
        );
      } else {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(closeSIxs, cEnvOpts, signer),
            description: DESC.close,
            details: takeArgs,
          })
        );
      }
    } else if (takerNftStd !== "compressed") {
      if (!royaltiesPaidTaker) {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(payRTakerIxs, cEnvOpts, signer),
            description: DESC.payRoyalties,
            details: takeArgs,
          })
        );
      }
      if (!royaltiesPaidMaker) {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(payRMakerIxs.concat(closeSIxs), cEnvOpts, signer),
            description: DESC.close,
            details: takeArgs,
          })
        );
      } else {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(closeSIxs, cEnvOpts, signer),
            description: DESC.close,
            details: takeArgs,
          })
        );
      }
    } else {
      BT.push(
        appendToBT({
          BT,
          tx: await ix2vTx(payRMakerIxs, cEnvOpts, signer),
          description: DESC.payMakerRoyalties,
          details: takeArgs,
        })
      );
      BT.push(
        appendToBT({
          BT,
          tx: await ix2vTx(payRTakerIxs, cEnvOpts, signer),
          description: DESC.payTakerRoyalties,
          details: takeArgs,
        })
      );
      BT.push(
        appendToBT({
          BT,
          tx: await ix2vTx(closeSIxs, cEnvOpts, signer),
          description: DESC.close,
          details: takeArgs,
        })
      );
    }
  } else {
    console.log("clump");
    let clumpAccept = [];
    try {
      if (!acceptedBid) clumpAccept.push(...takeIxs);
      if (!claimed) clumpAccept.push(...claimIxs);
      if (clumpAccept.length > 0) {
        let testVtx = appendToBT({
          tx: await ix2vTx(clumpAccept, cEnvOpts, signer),
          BT,
          description: DESC.takeSwap,
          details: takeArgs,
        });

        let seri = testVtx.tx.serialize().length;
        console.log("seri length", seri);
        if (seri > 1232) {
          throw "takeSwapIx too large";
        } else BT.push(testVtx);
      }
    } catch (error) {
      console.log("clumpAccept error", error);

      if (!acceptedBid) {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(takeIxs, cEnvOpts, signer),
            description: DESC.takeSwap,
            details: takeArgs,
          })
        );
      }
      if (!claimed) {
        BT.push(
          appendToBT({
            BT,
            tx: await ix2vTx(claimIxs, cEnvOpts, signer),
            description: DESC.claimSwap,
            details: takeArgs,
          })
        );
      }
    }

    let clumpClose = [];
    if (!royaltiesPaidMaker) clumpClose.push(...payRMakerIxs);
    if (!royaltiesPaidTaker) clumpClose.push(...payRTakerIxs);
    clumpClose.push(...closeSIxs);
    if (clumpClose.length > 0)
      BT.push(
        appendToBT({
          tx: await ix2vTx(clumpClose, cEnvOpts, signer),
          BT,
          description: DESC.close,
          details: takeArgs,
        })
      );
  }

  let { lastValidBlockHeight: blockheight, blockhash } = await connection.getLatestBlockhash();

  BT.map((b, i) => {
    b.tx.message.recentBlockhash = blockhash;
    b.blockheight = blockheight;
    console.log(i, "b serialized size", b.description, b.tx.serialize().length);
  });
  return BT;
}

export async function createCloseSwapIxs({
  cEnvOpts,
  maker,
  makerTokenAta,
  signer,
  swapDataAccount,
  swapDataAccountTokenAta,
  swapDataData,
  taker,
  unwrap,
  takerTokenAta,
}: {
  cEnvOpts: CEnvOpts;
  swapDataAccount: string;
  swapDataAccountTokenAta: string;

  maker: string;
  makerTokenAta: string;
  signer: string;

  swapDataData: SwapData;
  taker: string;
  takerTokenAta: string;

  unwrap?: boolean;
}) {
  let addToClaimIxs: TransactionInstruction[] = [];
  let closeSIxs: TransactionInstruction[] = [];
  let { program } = cEnvOpts;
  const closeIx = await program.methods
    .closeSwap()
    .accountsStrict({
      swapDataAccount,
      swapDataAccountTokenAta,

      maker,
      makerTokenAta,
      signer,

      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  closeSIxs.push(closeIx);

  if (
    swapDataData.paymentMint === WRAPPED_SOL_MINT.toString() &&
    (unwrap === undefined || unwrap === true)
  ) {
    if (signer === taker) addToClaimIxs.push(closeWSol(taker, taker, takerTokenAta));
    else if (signer === maker) closeSIxs.push(closeWSol(maker, maker, makerTokenAta));
  }
  return { closeSIxs, addToClaimIxs };
}
