import { getSdaData } from "../utils/getSdaData.function";
import { TransactionInstruction } from "@solana/web3.js";
import { BundleTransaction, EnvOpts, TakeSArg } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { NS_FEE, VERSION } from "../utils/const";
import {
  findNftDataAndMetadataAccount,
  whichStandard,
} from "../utils/findNftDataAndAccounts.function";
import { checkEnvOpts, getTakeArgs } from "../utils/check";
import { takerFee } from "../utils/fees";
import {
  createClaimSwapIxs,
  createCloseSwapIxs,
  createPayRoyaltiesIxs,
  createTakeSwapIxs,
  parseTakeAndCloseTxs,
} from "../utils/takeSwap.utils";

export async function createTakeAndCloseSwapInstructions(
  Data: TakeSArg & EnvOpts // & { index: number }
): Promise<BundleTransaction[]> {
  console.log(VERSION);
  let cEnvOpts = await checkEnvOpts(Data);
  let takeArgs = getTakeArgs(Data);
  let { program, connection } = cEnvOpts;
  let {
    taker,
    swapDataAccount,
    bid,
    nftMintTaker,
    verifyTaker,
    signer,
    n,
    unwrap,
    traitIndex,
    traitProofs,
  } = takeArgs;
  if (!n) n = 0;

  if (!signer) {
    console.log("no signer", taker);
    signer = taker;
  } else console.log("signer", signer, "taker", taker);

  let takeIxs: TransactionInstruction[] = [];
  let claimIxs: TransactionInstruction[] = [];
  let payRMakerIxs: TransactionInstruction[] = [];
  let payRTakerIxs: TransactionInstruction[] = [];
  try {
    let swapDataData = await getSdaData({
      program,
      swapDataAccount,
    });

    const {
      paymentMint: paymentMint,
      maker,
      nftMintMaker,
      bids,
      acceptedBid,
      royaltiesPaidMaker,
      royaltiesPaidTaker,
      claimed,
    } = swapDataData;

    if (verifyTaker && swapDataData.taker && swapDataData.taker !== taker)
      throw "signer is not the taker of this swap";

    // checking the bid we want exists in SDA
    const foundBid = bids.find(
      (b) =>
        b.amount === bid.amount &&
        b.collection === bid.collection &&
        b.takerNeoswapFee === bid.takerNeoswapFee &&
        b.takerRoyalties === bid.takerRoyalties &&
        b.makerRoyalties === bid.makerRoyalties &&
        b.makerNeoswapFee === bid.makerNeoswapFee
    );
    if (!foundBid)
      throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(
        bids
      )} `;

    // finding which standard the nfts are
    let makerNftStd = await whichStandard({ connection, mint: nftMintMaker });
    let takerNftStd = await whichStandard({ connection, mint: nftMintTaker });
    let bidAccount;
    if (
      traitIndex !== undefined &&
      traitProofs !== undefined &&
      traitProofs.length > 0
    ) {
      bidAccount = foundBid.collection;
    }
    //
    // finding payment ATAs
    //

    let { mintAta: takerTokenAta, instruction: takerTokenIx } =
      await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: taker,
        signer,
      });
    if (takerTokenIx) {
      takeIxs.push(takerTokenIx);
      claimIxs.push(takerTokenIx);
    } else console.log("takerTokenAta", takerTokenAta);

    let { mintAta: swapDataAccountTokenAta, instruction: sdaTokenIx } =
      await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: swapDataAccount,
        signer,
      });
    // if (sdaTokenIx) takeAndClaimIxs.push(sdaTokenIx);
    // else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

    let { mintAta: makerTokenAta, instruction: makerTokenIx } =
      await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: maker,
        signer,
      });
    if (makerTokenIx) {
      takeIxs.push(makerTokenIx);
      claimIxs.push(makerTokenIx);
    } else console.log("makerTokenAta", makerTokenAta);

    let { mintAta: nsFeeTokenAta, instruction: nsTokenIx } =
      await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: NS_FEE,
        signer,
      });
    if (nsTokenIx) claimIxs.push(nsTokenIx);
    else console.log("nsFeeTokenAta", nsFeeTokenAta);

    //
    // Getting metadata Maker Nft
    //

    let nftMetadataMaker: string | undefined;
    let tokenStandardMaker: number | undefined;

    if (makerNftStd === "native") {
      console.log("makerNftStd", makerNftStd);

      const {
        metadataAddress: nftMetadataMaker2,
        tokenStandard: tokenStandardMaker2,
      } = await findNftDataAndMetadataAccount({
        connection,
        mint: nftMintMaker,
      });
      nftMetadataMaker = nftMetadataMaker2;
      tokenStandardMaker = tokenStandardMaker2;
      // console.log("nftMetadataMaker", nftMetadataMaker);
    }

    //
    // Getting metadata Taker Nft
    //

    let nftMetadataTaker: string | undefined;
    let tokenStandardTaker: number | undefined;

    if (takerNftStd === "native") {
      const {
        metadataAddress: nftMetadataTaker2,
        tokenStandard: tokenStandardTaker2,
      } = await findNftDataAndMetadataAccount({
        connection,
        mint: nftMintTaker,
      });
      nftMetadataTaker = nftMetadataTaker2;
      tokenStandardTaker = tokenStandardTaker2;
      // console.log("nftMetadataTaker", nftMetadataTaker);
    }

    //
    // taking Swap
    //

    let takerAmount = takerFee({ bid, n });
    if (!acceptedBid) {
      //  let { nftMetadataTaker, takeIxs } =
      await createTakeSwapIxs({
        bid,
        cEnvOpts,
        connection,
        maker,
        makerTokenAta,
        n,
        nftMintTaker,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        swapDataData,
        taker,
        takerAmount,
        takerNftStd,
        takerTokenAta,
        tokenStandardTaker,
        bidAccount,
        nftMetadataTaker,
        traitIndex,
        traitProofs,
      }).then((takeData) => {
        if (takeData.nftMetadataTaker) {
          nftMetadataTaker = takeData.nftMetadataTaker;
        }
        takeIxs.push(...takeData.takeIxs);
      });
    }

    if (!claimed) {
      await createClaimSwapIxs({
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
      }).then((claimData) => {
        if (claimData.nftMetadataMaker) {
          nftMetadataMaker = claimData.nftMetadataMaker;
        }
        takeIxs.push(...claimData.claimIxs);
      });
    }

    //
    // Paying royalties Taker
    //

    if (!royaltiesPaidTaker) {
      console.log("royaltiesPaidTaker", makerNftStd);
      await createPayRoyaltiesIxs({
        cEnvOpts,
        connection,
        nftCurrentOwner: swapDataAccount,
        nftMint: nftMintMaker,
        payer: taker,
        paymentMint,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        tokenStandard: makerNftStd,
        nftMetadata: nftMetadataMaker,
      }).then((payRoyaltiesData) => {
        if (payRoyaltiesData.nftMetadata) {
          nftMetadataMaker = payRoyaltiesData.nftMetadata;
        }
        payRTakerIxs.push(...payRoyaltiesData.payRTakerIxs);
      });

      // if (makerNftStd === "core") {
      //   let {
      //     creators: makerCreators,
      //     creatorTokenAta: makerCreatorTokenAta,
      //     instructions: creatorIxs,
      //   } = await getCreatorData({
      //     connection,
      //     nftMint: nftMintMaker,
      //     owner: swapDataAccount,
      //     paymentMint,
      //     signer,
      //     tokenStandard: makerNftStd,
      //   });
      //   let payTakerCoreIx = await program.methods
      //     .payRoyaltiesCore()
      //     .accountsStrict({
      //       swapDataAccount,
      //       swapDataAccountTokenAta,
      //       nftMint: nftMintMaker,
      //       // paymentMint,
      //       signer,
      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,
      //       creator0: makerCreators[0],
      //       creator0TokenAta: makerCreatorTokenAta[0],
      //       creator1: makerCreators[1],
      //       creator1TokenAta: makerCreatorTokenAta[1],
      //       creator2: makerCreators[2],
      //       creator2TokenAta: makerCreatorTokenAta[2],
      //       creator3: makerCreators[3],
      //       creator3TokenAta: makerCreatorTokenAta[3],
      //       creator4: makerCreators[4],
      //       creator4TokenAta: makerCreatorTokenAta[4],
      //       tokenProgram: TOKEN_PROGRAM_ID,
      //     })
      //     .instruction();
      //   payRTakerIxs.push(...creatorIxs);
      //   payRTakerIxs.push(payTakerCoreIx);
      // } else if (makerNftStd === "compressed") {
      //   let {
      //     creators: makerCreators,
      //     creatorTokenAta: makerCreatorTokenAta,
      //     instructions: creatorIxs,
      //   } = await getCreatorData({
      //     connection,
      //     nftMint: nftMintMaker,
      //     owner: taker,
      //     paymentMint,
      //     signer,
      //     tokenStandard: makerNftStd,
      //   });
      //   // console.log("was pay royalties taker", makerCreators, makerCreatorTokenAta);

      //   let cluster = (
      //     !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
      //   ) as Cluster;
      //   let { index, merkleTree, nonce, proofMeta, root, metadata, owner } =
      //     await getCompNFTData({
      //       cluster,
      //       tokenId: nftMintMaker,
      //       connection,
      //       getRootHash: "calculate",
      //       newOwner: taker,
      //     });
      //   if (!metadata) throw "Compressed no metadata found";
      //   if (metadata.collection == null) throw "Compressed no collection found";

      //   let payTakerCoreIx = await program.methods
      //     .payRoyaltiesComp(
      //       root,
      //       metadata.name,
      //       metadata.symbol,
      //       metadata.uri,
      //       metadata.sellerFeeBasisPoints,
      //       metadata.primarySaleHappened,
      //       metadata.isMutable,
      //       metadata.editionNonce,
      //       metadata.creators,
      //       metadata.collection,
      //       nonce,
      //       index
      //     )
      //     .accountsStrict({
      //       swapDataAccount,
      //       swapDataAccountTokenAta,
      //       // nftMint: nftMintMaker,

      //       // paymentMint,
      //       merkleTree,
      //       owner,
      //       signer,
      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,
      //       creator0: makerCreators[0],
      //       creator0TokenAta: makerCreatorTokenAta[0],
      //       creator1: makerCreators[1],
      //       creator1TokenAta: makerCreatorTokenAta[1],
      //       creator2: makerCreators[2],
      //       creator2TokenAta: makerCreatorTokenAta[2],
      //       creator3: makerCreators[3],
      //       creator3TokenAta: makerCreatorTokenAta[3],
      //       creator4: makerCreators[4],
      //       creator4TokenAta: makerCreatorTokenAta[4],
      //       tokenProgram: TOKEN_PROGRAM_ID,
      //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      //     })
      //     .remainingAccounts(proofMeta)
      //     .instruction();
      //   payRTakerIxs.push(...creatorIxs);
      //   payRTakerIxs.push(payTakerCoreIx);
      // } else if (makerNftStd === "native") {
      //   let {
      //     creators: makerCreator,
      //     creatorTokenAta: makerCreatorTokenAta,
      //     instructions: creatorIxs,
      //   } = await getCreatorData({
      //     connection,
      //     nftMint: nftMintMaker,
      //     paymentMint,
      //     owner: swapDataAccount,
      //     signer,
      //     tokenStandard: makerNftStd,
      //   });

      //   if (creatorIxs.length > 0) {
      //     console.log("creatorIxs added", creatorIxs.length);
      //     payRTakerIxs.push(...creatorIxs);
      //   }

      //   if (!nftMetadataMaker)
      //     nftMetadataMaker = (
      //       await findNftDataAndMetadataAccount({
      //         connection,
      //         mint: nftMintMaker,
      //       })
      //     ).metadataAddress;

      //   const payRIx = await program.methods
      //     .payRoyalties()
      //     .accountsStrict({
      //       swapDataAccount,
      //       swapDataAccountTokenAta,

      //       // paymentMint,

      //       signer,

      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,

      //       nftMetadata: nftMetadataMaker,
      //       nftMint: nftMintMaker,

      //       metadataProgram: TOKEN_METADATA_PROGRAM,
      //       tokenProgram: TOKEN_PROGRAM_ID.toString(),

      //       creator0: makerCreator[0],
      //       creator0TokenAta: makerCreatorTokenAta[0],
      //       creator1: makerCreator[1],
      //       creator1TokenAta: makerCreatorTokenAta[1],
      //       creator2: makerCreator[2],
      //       creator2TokenAta: makerCreatorTokenAta[2],
      //       creator3: makerCreator[3],
      //       creator3TokenAta: makerCreatorTokenAta[3],
      //       creator4: makerCreator[4],
      //       creator4TokenAta: makerCreatorTokenAta[4],
      //     })
      //     .instruction();
      //   payRTakerIxs.push(payRIx);
      //   // console.log("payRIx", payRIx);
      // } else {
      //   const payRIx = await program.methods
      //     .payRoyalties22()
      //     .accountsStrict({
      //       swapDataAccount,
      //       // swapDataAccountTokenAta,
      //       nftMint: nftMintMaker,

      //       signer,

      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,
      //       tokenProgram22: TOKEN_2022_PROGRAM_ID,
      //       // tokenProgram: TOKEN_PROGRAM_ID,
      //     })
      //     .instruction();
      //   payRTakerIxs.push(payRIx);
      // }
    }

    //
    // Paying royalties maker
    //

    if (!royaltiesPaidMaker) {
      console.log("royaltiesPaidMaker", takerNftStd);
      await createPayRoyaltiesIxs({
        cEnvOpts,
        connection,
        nftCurrentOwner: taker,
        nftMint: nftMintMaker,
        payer: maker,
        paymentMint,
        signer,
        swapDataAccount,
        swapDataAccountTokenAta,
        tokenStandard: takerNftStd,
        nftMetadata: nftMetadataTaker,
      }).then((payRoyaltiesData) => {
        if (payRoyaltiesData.nftMetadata) {
          nftMetadataTaker = payRoyaltiesData.nftMetadata;
        }
        payRMakerIxs.push(...payRoyaltiesData.payRTakerIxs);
      });

      // if (takerNftStd === "core") {
      //   let {
      //     creators: makerCreators,
      //     creatorTokenAta: makerCreatorTokenAta,
      //     instructions: creatorIxs,
      //   } = await getCreatorData({
      //     connection,
      //     nftMint: nftMintTaker,
      //     owner: swapDataAccount,
      //     paymentMint,
      //     signer,
      //     tokenStandard: takerNftStd,
      //   });
      //   let payTakerCoreIx = await program.methods
      //     .payRoyaltiesCore()
      //     .accountsStrict({
      //       swapDataAccount,
      //       swapDataAccountTokenAta,
      //       nftMint: nftMintTaker,
      //       // paymentMint,
      //       signer,
      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,
      //       creator0: makerCreators[0],
      //       creator0TokenAta: makerCreatorTokenAta[0],
      //       creator1: makerCreators[1],
      //       creator1TokenAta: makerCreatorTokenAta[1],
      //       creator2: makerCreators[2],
      //       creator2TokenAta: makerCreatorTokenAta[2],
      //       creator3: makerCreators[3],
      //       creator3TokenAta: makerCreatorTokenAta[3],
      //       creator4: makerCreators[4],
      //       creator4TokenAta: makerCreatorTokenAta[4],
      //       tokenProgram: TOKEN_PROGRAM_ID,
      //     })
      //     .instruction();
      //   payRMakerIxs.push(...creatorIxs);
      //   payRMakerIxs.push(payTakerCoreIx);
      // } else if (takerNftStd === "compressed") {
      //   let {
      //     creators: makerCreators,
      //     creatorTokenAta: makerCreatorTokenAta,
      //     instructions: creatorIxs,
      //   } = await getCreatorData({
      //     connection,
      //     nftMint: nftMintTaker,
      //     owner: maker,
      //     paymentMint,
      //     signer,
      //     tokenStandard: takerNftStd,
      //   });

      //   let cluster = (
      //     !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
      //   ) as Cluster;
      //   let { index, merkleTree, nonce, proofMeta, root, metadata, owner } =
      //     await getCompNFTData({
      //       cluster,
      //       tokenId: nftMintTaker,
      //       connection,
      //       getRootHash: "calculate",
      //       newOwner: maker,
      //     });
      //   if (!metadata) throw "Compressed no metadata found";
      //   if (metadata.collection == null) throw "Compressed no collection found";

      //   let payTakerCoreIx = await program.methods
      //     .payRoyaltiesComp(
      //       root,
      //       metadata.name,
      //       metadata.symbol,
      //       metadata.uri,
      //       metadata.sellerFeeBasisPoints,
      //       metadata.primarySaleHappened,
      //       metadata.isMutable,
      //       metadata.editionNonce,
      //       metadata.creators,
      //       metadata.collection,
      //       nonce,
      //       index
      //     )
      //     .accountsStrict({
      //       swapDataAccount,
      //       swapDataAccountTokenAta,
      //       // nftMint: nftMintMaker,

      //       // paymentMint,
      //       merkleTree,
      //       owner,
      //       signer,
      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,
      //       creator0: makerCreators[0],
      //       creator0TokenAta: makerCreatorTokenAta[0],
      //       creator1: makerCreators[1],
      //       creator1TokenAta: makerCreatorTokenAta[1],
      //       creator2: makerCreators[2],
      //       creator2TokenAta: makerCreatorTokenAta[2],
      //       creator3: makerCreators[3],
      //       creator3TokenAta: makerCreatorTokenAta[3],
      //       creator4: makerCreators[4],
      //       creator4TokenAta: makerCreatorTokenAta[4],
      //       tokenProgram: TOKEN_PROGRAM_ID,
      //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      //     })
      //     .remainingAccounts(proofMeta)
      //     .instruction();
      //   payRMakerIxs.push(...creatorIxs);
      //   payRMakerIxs.push(payTakerCoreIx);
      // } else if (takerNftStd === "native") {
      //   let {
      //     creators: takerCreator,
      //     creatorTokenAta: takerCreatorTokenAta,
      //     instructions: creatorIxs,
      //   } = await getCreatorData({
      //     connection,
      //     paymentMint,
      //     owner: swapDataAccount,
      //     signer,
      //     nftMint: nftMintTaker,
      //     tokenStandard: takerNftStd,
      //   });

      //   if (creatorIxs) payRMakerIxs.push(...creatorIxs);

      //   if (!nftMetadataTaker)
      //     nftMetadataTaker = (
      //       await findNftDataAndMetadataAccount({
      //         connection,
      //         mint: nftMintTaker,
      //       })
      //     ).metadataAddress;

      //   const payRIx = await program.methods
      //     .payRoyalties()
      //     .accountsStrict({
      //       swapDataAccount,
      //       swapDataAccountTokenAta,

      //       // paymentMint,

      //       signer,

      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,

      //       nftMint: nftMintTaker,
      //       nftMetadata: nftMetadataTaker,

      //       metadataProgram: TOKEN_METADATA_PROGRAM,
      //       tokenProgram: TOKEN_PROGRAM_ID,

      //       creator0: takerCreator[0],
      //       creator0TokenAta: takerCreatorTokenAta[0],
      //       creator1: takerCreator[1],
      //       creator1TokenAta: takerCreatorTokenAta[1],
      //       creator2: takerCreator[2],
      //       creator2TokenAta: takerCreatorTokenAta[2],
      //       creator3: takerCreator[3],
      //       creator3TokenAta: takerCreatorTokenAta[3],
      //       creator4: takerCreator[4],
      //       creator4TokenAta: takerCreatorTokenAta[4],
      //     })
      //     .instruction();
      //   payRMakerIxs.push(payRIx);
      // } else {
      //   // console.log("payMakerRoyalties22 signer,", signer);

      //   const payRIx = await program.methods
      //     .payRoyalties22()
      //     .accountsStrict({
      //       swapDataAccount,
      //       // swapDataAccountTokenAta,
      //       nftMint: nftMintTaker,
      //       signer,
      //       // nsFee: NS_FEE,
      //       // nsFeeTokenAta,
      //       tokenProgram22: TOKEN_2022_PROGRAM_ID,
      //       // tokenProgram: TOKEN_PROGRAM_ID,
      //     })
      //     .instruction();
      //   payRMakerIxs.push(payRIx);
      // }
    }

    //
    // Closing
    //
    let { addToClaimIxs, closeSIxs } = await createCloseSwapIxs({
      cEnvOpts,
      maker,
      makerTokenAta,
      signer,
      swapDataAccount,
      swapDataAccountTokenAta,
      swapDataData,
      taker,
      takerTokenAta,
      unwrap,
    });
    if (addToClaimIxs.length > 1) claimIxs.push(...addToClaimIxs);

    let bTTakeAndClose = parseTakeAndCloseTxs({
      cEnvOpts,
      claimIxs,
      closeSIxs,
      connection,
      makerNftStd,
      payRMakerIxs,
      payRTakerIxs,
      signer,
      takeArgs,
      takeIxs,
      takerNftStd,
      acceptedBid,
      claimed,
      royaltiesPaidMaker,
      royaltiesPaidTaker,
    });
    return bTTakeAndClose;
  } catch (error: any) {
    console.log("error init", error);

    throw {
      blockchain: "solana",
      status: "error",
      message: error,
      swapDataAccount,
    };
  }
}
