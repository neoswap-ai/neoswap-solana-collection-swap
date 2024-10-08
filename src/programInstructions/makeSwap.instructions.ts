import {
  ComputeBudgetProgram,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  clusterApiUrl,
  Cluster,
  PublicKey,
} from "@solana/web3.js";
import { BTv, EnvOpts, MakeSArg, ReturnSwapData, UpdateSArgs } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  METAPLEX_AUTH_RULES_PROGRAM,
  // SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM,
  VERSION,
} from "../utils/const";
import { BN } from "bn.js";
import {
  findNftDataAndMetadataAccount,
  findPnftAccounts,
  getCoreCollection,
  whichStandard,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { getSda } from "../utils/getPda";
import { bidToscBid } from "../utils/typeSwap";
import { DESC } from "../utils/descriptions";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol } from "../utils/wsol";
import { checkEnvOpts, getMakeArgs } from "../utils/check";
import { appendBtByChunk, ix2vTx } from "../utils/vtx";
import { createAddBidIx } from "./modifyAddBid.instructions";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { calculateMakerFee, makerFee } from "../utils/fees";
import { getCompNFTData } from "../utils/compressedHelper";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { SPL_ASSOCIATED_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import { createMakeBatchTransactions } from "../utils/makeSwap.utils";

export async function createMakeSwapInstructions(
  Data: MakeSArg & EnvOpts
): Promise<ReturnSwapData> {
  console.log(VERSION);
  let cEnvOpts = await checkEnvOpts(Data);
  let makeArgs = getMakeArgs(Data);
  let { program, connection } = cEnvOpts;
  let { bids, endDate, maker, nftMintMaker, paymentMint } = makeArgs;

  let swapDataAccount = getSda(maker, nftMintMaker, program.programId.toString());
  console.log("swapDataAccount", swapDataAccount);

  let initializeCoreSwap: TransactionInstruction[] = [];
  let cluster = (!cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta") as Cluster;
  try {
    let { mintAta: swapDataAccountTokenAta, instruction: st } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: swapDataAccount,
      signer: maker,
    });
    if (st) initializeCoreSwap.push(st);
    else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

    let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: maker,
      signer: maker,
    });
    if (mt) initializeCoreSwap.push(mt);
    else console.log("makerTokenAta", makerTokenAta);

    bids = bids.sort((bidA, bidB) => {
      let amountA = makerFee({ bid: bidA });
      let amountB = makerFee({ bid: bidB });
      return amountB - amountA;
    });
    console.log("bids", bids);
    let oneBid = bids[0];
    let leftBids = bids.slice(1).length > 0 ? bids.slice(1) : [];

    // if wSOL
    if (paymentMint === WRAPPED_SOL_MINT.toString()) {
      let maxAmount = calculateMakerFee({ bids });
      console.log("maxAmount", maxAmount);

      if (maxAmount > 0) initializeCoreSwap.push(...addWSol(maker, makerTokenAta, maxAmount));
    }

    let tokenStd = await whichStandard({ mint: nftMintMaker, connection });
    console.log("Token standard", tokenStd);

    if (tokenStd === "core") {
      let coreCollection = await getCoreCollection({ mint: nftMintMaker, connection });
      program.idl.types[5].type.variants[0];
      const initIx = await program.methods
        .makeSwapCore(bidToscBid(oneBid), new BN(endDate), false)
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
      initializeCoreSwap.push(initIx);
    } else if (tokenStd === "compressed") {
      let { creatorHash, dataHash, index, merkleTree, nonce, proofMeta, root, treeAuthority } =
        await getCompNFTData({ cluster, tokenId: nftMintMaker, connection });

      let makeCompData = await program.methods
        .makeSwapComp(
          bidToscBid(oneBid),
          new BN(endDate),
          Array.from(root),
          Array.from(dataHash),
          Array.from(creatorHash),
          nonce,
          index,
          false
          // new PublicKey(nftMintMaker)
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
      initializeCoreSwap.push(makeCompData);
    } else if (tokenStd === "native" || tokenStd === "hybrid") {
      let { mintAta: swapDataAccountNftAta, instruction: sn } = await findOrCreateAta({
        connection,
        mint: nftMintMaker,
        owner: swapDataAccount,
        signer: maker,
      });
      if (sn) initializeCoreSwap.push(sn);
      else console.log("swapDataAccountNftAta", swapDataAccountNftAta);

      let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
        connection,
        mint: nftMintMaker,
        owner: maker,
        signer: maker,
      });
      if (mn) initializeCoreSwap.push(mn);
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
          .makeSwap(bidToscBid(oneBid), new BN(endDate), false)
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
        initializeCoreSwap.push(initIx);
      } else if (tokenStd === "hybrid") {
        const initIx = await program.methods
          .makeSwap22(bidToscBid(oneBid), new BN(endDate), false)
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
        initializeCoreSwap.push(initIx);
      } else throw "not supported";
    } else throw "token not supported";

    let addBidIxs: TransactionInstruction[] = [];
    if (leftBids.length > 0) {
      let bidDataIxs = await createAddBidIx({
        swapDataAccount,
        bids: leftBids,
        maker,
        paymentMint,
        makerTokenAta,
        swapDataAccountTokenAta,
        ...cEnvOpts,
      });
      addBidIxs.push(...bidDataIxs.ataIxs);
      addBidIxs.push(...bidDataIxs.bidIxs);
    }

    let bTxs: BTv[] = await appendBtByChunk(
      createMakeBatchTransactions({
        initializeCoreSwap,
        addBidIxs,
        firstBid: oneBid,
        otherBids: leftBids,
        Data: makeArgs,
      }),
      cEnvOpts,
      maker
    );

    return {
      bTxs,
      swapDataAccount: swapDataAccount.toString(),
    };
  } catch (error: any) {
    console.log("error init", error);

    throw {
      blockchain: "solana",
      status: "error",
      message: error,
      swapDataAccount: swapDataAccount,
    };
  }
}
