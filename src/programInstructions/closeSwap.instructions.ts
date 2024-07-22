// import { getSdaData } from "../utils/getSdaData.function";
// import {
//     ComputeBudgetProgram,
//     SYSVAR_INSTRUCTIONS_PUBKEY,
//     SystemProgram,
//     TransactionInstruction,
// } from "@solana/web3.js";
// import { BundleTransaction, ClaimSArg, EnvOpts } from "../utils/types";
// import { findOrCreateAta } from "../utils/findOrCreateAta.function";
// import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import {
//     METAPLEX_AUTH_RULES_PROGRAM,
//     NS_FEE,
//     SOLANA_SPL_ATA_PROGRAM_ID,
//     TOKEN_METADATA_PROGRAM,
//     VERSION,
// } from "../utils/const";
// import {
//     findNftDataAndMetadataAccount,
//     findNftMasterEdition,
//     findRuleSet,
//     findUserTokenRecord,
// } from "../utils/findNftDataAndAccounts.function";
// import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
// import { DESC } from "../utils/descriptions";
// import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
// import { closeWSol } from "../utils/wsol";
// import { checkEnvOpts, getClaimSArgs } from "../utils/check";
// import { ix2vTx } from "../utils/vtx";

// export async function createCloseSwapInstructions(
//     Data: EnvOpts & ClaimSArg
// ): Promise<BundleTransaction> {
//     console.log(VERSION);
//     let cEnvOpts = await checkEnvOpts(Data);
//     let ClaimSArgs = getClaimSArgs(Data);
//     let { program, connection } = cEnvOpts;
//     let { signer, swapDataAccount } = ClaimSArgs;

//     let instructions: TransactionInstruction[] = [
//         ComputeBudgetProgram.setComputeUnitLimit({
//             units: 800000,
//         }),
//     ];

//     try {
//         let swapDataData = await getSdaData({
//             program,
//             swapDataAccount,
//         });
//         if (!swapDataData) throw "no swapData found at " + swapDataAccount;
//         let { paymentMint, maker, taker, acceptedBid } = swapDataData;

//         if (!(taker && acceptedBid))
//             throw "SDA doesnt have accepted bids" + JSON.stringify(swapDataData);

//         let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
//             connection,
//             mint: paymentMint,
//             owner: taker,
//             signer,
//         });
//         if (tt) instructions.push(tt);
//         else console.log("takerTokenAta", takerTokenAta);

//         let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
//             connection,
//             mint: paymentMint,
//             owner: swapDataAccount,
//             signer,
//         });
//         if (sdat) instructions.push(sdat);
//         else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

//         let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
//             connection,
//             mint: paymentMint,
//             owner: maker,
//             signer,
//         });
//         if (mt) instructions.push(mt);
//         else console.log("makerTokenAta", makerTokenAta);

//         const initIx = await program.methods
//             .claimSwap()
//             .accountsStrict({
//                 swapDataAccount,
//                 swapDataAccountTokenAta,

//                 maker,
//                 makerTokenAta,

//                 paymentMint,
//                 signer,

//                 systemProgram: SystemProgram.programId,
//                 tokenProgram: TOKEN_PROGRAM_ID,

//                 ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
//                 metadataProgram: TOKEN_METADATA_PROGRAM,
//                 authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
//                 authRulesMaker,
//                 destinationTokenRecordMaker,
//                 nftMasterEditionMaker,
//                 nftMetadataMaker,
//                 nftMintMaker,
//                 nsFee,
//                 nsFeeTokenAta,
//                 ownerTokenRecordMaker,
//                 swapDataAccountNftAta,
//                 sysvarInstructions,
//                 taker,
//                 takerNftAtaMaker,
//                 takerTokenAta,
//             })
//             .instruction();
//         instructions.push(initIx);

//         if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString())
//             if (signer === taker) instructions.push(closeWSol(taker, taker, takerTokenAta));
//             else if (signer === maker) instructions.push(closeWSol(maker, maker, makerTokenAta));

//         return {
//             tx: await ix2vTx(instructions, cEnvOpts, signer),
//             description: DESC.claimSwap,
//             details: Data,
//             priority: 0,
//             status: "pending",
//         } as BundleTransaction;
//     } catch (error: any) {
//         console.log("error init", error);

//         throw {
//             blockchain: "solana",
//             status: "error",
//             message: error,
//             swapDataAccount: swapDataAccount,
//         };
//     }
// }
