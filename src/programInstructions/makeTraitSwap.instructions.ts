import { TransactionInstruction } from "@solana/web3.js";
import {
  BTv,
  EnvOpts,
  MakeTraitSArg,
  ReturnSwapData,
  UpdateSArgs,
} from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { VERSION } from "../utils/const";
import { whichStandard } from "../utils/findNftDataAndAccounts.function";
import { getSda } from "../utils/getPda";
import { DESC } from "../utils/descriptions";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol } from "../utils/wsol";
import { checkEnvOpts, getMakeTraitsArgs } from "../utils/check";
import { appendToBT, ix2vTx } from "../utils/vtx";
import { calculateMakerFee } from "../utils/fees";
import {
  getBidAccountInstructions,
  getBidsForMake,
  createTraitBidSwapIx,
  createAdditionalTraitSwapBidIx,
} from "../utils/makeSwap.utils";

export async function createMakeTraitSwapInstructions(
  Data: MakeTraitSArg & EnvOpts
): Promise<ReturnSwapData> {
  console.log(VERSION);
  let cEnvOpts = await checkEnvOpts(Data);
  let makeArgs = await getMakeTraitsArgs(Data);
  let { program, connection, cluster } = cEnvOpts;
  let {
    bids: givenBids,
    traitBids,
    endDate,
    maker,
    nftMintMaker,
    paymentMint,
  } = makeArgs;

  let swapDataAccount = getSda(
    maker,
    nftMintMaker,
    program.programId.toString()
  );
  console.log("swapDataAccount", swapDataAccount);

  let instructions: TransactionInstruction[] = [];

  try {
    let { mintAta: swapDataAccountTokenAta, instruction: st } =
      await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: swapDataAccount,
        signer: maker,
      });
    if (st) instructions.push(st);
    else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

    let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
      connection,
      mint: paymentMint,
      owner: maker,
      signer: maker,
    });
    if (mt) instructions.push(mt);
    else console.log("makerTokenAta", makerTokenAta);

    let { bids, firstBid, otherBids } = getBidsForMake(givenBids);

    // initialize all traitbids accounts
    let initializeBidAccountIxs = await getBidAccountInstructions({
      cEnvOpts,
      signer: maker,
      traitBids,
    });
    instructions.push(...initializeBidAccountIxs);

    // if wSOL
    if (paymentMint === WRAPPED_SOL_MINT.toString()) {
      let maxAmount = calculateMakerFee({ bids });
      console.log("Wsol maxAmount", maxAmount);

      if (maxAmount > 0)
        instructions.push(...addWSol(maker, makerTokenAta, maxAmount));
    }

    let tokenStd = await whichStandard({ mint: nftMintMaker, connection });
    console.log("mintMaker Token standard", tokenStd);

    let makeTraitSwapIxs = await createTraitBidSwapIx({
      cEnvOpts,
      connection,
      endDate,
      firstBid,
      maker,
      makerTokenAta,
      nftMintMaker,
      paymentMint,
      signer: maker,
      swapDataAccount,
      swapDataAccountTokenAta,
      tokenStd,
      traitBids,
    });
    instructions.push(...makeTraitSwapIxs);

    let {
      addBidIxs,
      makeBidIxs,
      firstBids: firstAddedBids,
      otherBids: otherAddedBids,
    } = await createAdditionalTraitSwapBidIx({
      cEnvOpts,
      maker,
      makerTokenAta,
      otherBids,
      paymentMint,
      swapDataAccount,
      swapDataAccountTokenAta,
    });
    instructions.push(...makeBidIxs);

    let bTxs: BTv[] = [
      appendToBT({
        description: DESC.makeSwap,
        details: { ...Data, thisBids: { ...firstBid, firstAddedBids }, bids },
        tx: await ix2vTx(instructions, cEnvOpts, maker),
      }),
    ];

    if (addBidIxs.length > 0) {
      bTxs.push(
        appendToBT({
          BT: bTxs,
          description: DESC.addBid,
          details: {
            swapDataAccount,
            thisBids: { otherAddedBids },
            bids,
            maker,
          } as UpdateSArgs,
          tx: await ix2vTx(addBidIxs, cEnvOpts, maker),
        })
      );
    }
    console.log("addBidIxs", addBidIxs.length);

    return {
      bTxs,
      swapDataAccount,
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
