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

// export async function createClaimSwapInstructions(
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
//         let { paymentMint, maker, nftMintMaker, taker, nftMintTaker, acceptedBid } = swapDataData;

//         if (!(nftMintTaker && taker && acceptedBid))
//             throw "SDA doesnt have accepted bids" + JSON.stringify(swapDataData);

//         let { mintAta: swapDataAccountNftAta, instruction: sdan } = await findOrCreateAta({
//             connection,
//             mint: nftMintMaker,
//             owner: swapDataAccount,
//             signer,
//         });
//         if (sdan) instructions.push(sdan);
//         else console.log("swapDataAccountNftAta", swapDataAccountNftAta);
//         let {
//             mintAta: takerNftAtaMaker,
//             instruction: tmn,
//             tokenProgram,
//         } = await findOrCreateAta({
//             connection,
//             mint: nftMintMaker,
//             owner: taker,
//             signer,
//         });
//         if (tmn) instructions.push(tmn);
//         else console.log("takerNftAta", takerNftAtaMaker);

//         let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
//             connection,
//             mint: paymentMint,
//             owner: taker,
//             signer,
//         });
//         if (tt) instructions.push(tt);
//         else console.log("takerTokenAta", takerTokenAta);

//         let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
//             connection,
//             mint: paymentMint,
//             owner: NS_FEE,
//             signer,
//         });
//         if (nst) instructions.push(nst);
//         else console.log("nsFeeTokenAta", nsFeeTokenAta);

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

//         let nftMasterEditionMaker = taker;
//         let ownerTokenRecordMaker = taker;
//         let destinationTokenRecordMaker = taker;
//         let authRulesMaker = taker;
//         let nftMetadataMaker = taker;

//         if (!tokenProgram) tokenProgram = TOKEN_PROGRAM_ID.toString();
//         if (tokenProgram == TOKEN_PROGRAM_ID.toString()) {
//             const { metadataAddress: nftMetadataMaker2, tokenStandard: tokenStandardMaker } =
//                 await findNftDataAndMetadataAccount({
//                     connection,
//                     mint: nftMintMaker,
//                 });
//             nftMetadataMaker = nftMetadataMaker2;
//             console.log("nftMetadataMaker", nftMetadataMaker);

//             if (tokenStandardMaker == TokenStandard.ProgrammableNonFungible) {
//                 const nftMasterEditionF = findNftMasterEdition({
//                     mint: nftMintMaker,
//                 });

//                 const ownerTokenRecordF = findUserTokenRecord({
//                     mint: nftMintMaker,
//                     userMintAta: swapDataAccountNftAta,
//                 });

//                 const destinationTokenRecordF = findUserTokenRecord({
//                     mint: nftMintMaker,
//                     userMintAta: takerNftAtaMaker,
//                 });

//                 const authRulesF = await findRuleSet({
//                     connection,
//                     mint: nftMintMaker,
//                 });
//                 nftMasterEditionMaker = nftMasterEditionF;
//                 ownerTokenRecordMaker = ownerTokenRecordF;
//                 destinationTokenRecordMaker = destinationTokenRecordF;
//                 authRulesMaker = authRulesF;
//             }
//         }

//         const initIx = await program.methods
//             .claimSwap()
//             .accountsStrict({
//                 swapDataAccount,
//                 swapDataAccountNftAta,
//                 swapDataAccountTokenAta,

//                 nsFee: NS_FEE,
//                 nsFeeTokenAta,

//                 signer,
//                 taker,
//                 takerNftAtaMaker,
//                 takerTokenAta,

//                 maker,
//                 makerTokenAta,

//                 nftMintMaker,
//                 paymentMint,

//                 nftMetadataMaker,
//                 nftMasterEditionMaker,
//                 ownerTokenRecordMaker,
//                 destinationTokenRecordMaker,
//                 authRulesMaker,

//                 systemProgram: SystemProgram.programId,
//                 metadataProgram: TOKEN_METADATA_PROGRAM,
//                 sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
//                 tokenProgram: TOKEN_PROGRAM_ID,
//                 // tokenProgram22: TOKEN_2022_PROGRAM_ID,
//                 ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
//                 authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
//             })
//             .instruction();
//         instructions.push(initIx);

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
