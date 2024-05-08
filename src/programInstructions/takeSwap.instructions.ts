import { getSdaData } from "../utils/getSdaData.function";
import {
    ComputeBudgetProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import { BundleTransaction, EnvOpts, TakeSArg } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
    VERSION,
} from "../utils/const";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { bidToscBid } from "../utils/typeSwap";
import { DESC } from "../utils/descriptions";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol } from "../utils/wsol";
import { checkEnvOpts, checkOptionSend, getTakeArgs } from "../utils/check";
import { ix2vTx } from "../utils/vtx";

export async function createTakeSwapInstructions(
    Data: TakeSArg & EnvOpts
): Promise<BundleTransaction> {
    console.log(VERSION);

    let cEnvOpts = await checkEnvOpts(Data);
    let takeArgs = getTakeArgs(Data);
    let { program, connection } = cEnvOpts;
    let { taker, swapDataAccount, bid, nftMintTaker } = takeArgs;

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program: program,
            swapDataAccount: swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;
        const { paymentMint, maker, nftMintMaker, bids } = swapDataData;
        console.log("bids", bids);

        const foundBid = bids.find(
            (b) =>
                b.amount === bid.amount &&
                b.collection === bid.collection &&
                b.takerNeoswapFee === bid.takerNeoswapFee &&
                b.takerRoyalties === bid.takerRoyalties &&
                b.makerRoyalties === bid.makerRoyalties &&
                b.makerNeoswapFee === bid.makerNeoswapFee
        );
        if (!foundBid) throw `bid ${JSON.stringify(bid)} not found in ${JSON.stringify(bids)} `;

        let {
            mintAta: takerNftAta,
            instruction: tn,
            tokenProgram,
        } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: taker,
            signer: taker,
        });
        if (tn) {
            instructions.push(tn);
            console.log("takerNftAta", takerNftAta);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer: taker,
        });
        if (tt) {
            instructions.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: maker,
            signer: taker,
        });
        if (mn) {
            instructions.push(mn);
            console.log("makerNftAta", makerNftAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: taker,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer: taker,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);
        }

        let nftMasterEditionTaker = taker;
        let ownerTokenRecordTaker = taker;
        let destinationTokenRecordTaker = taker;
        let authRulesTaker = taker;
        let nftMetadataTaker = taker;
        if (tokenProgram == TOKEN_PROGRAM_ID.toString()) {
            const { metadataAddress: nftMetadataTaker2, tokenStandard: tokenStandardTaker } =
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintTaker,
                });
            nftMetadataTaker = nftMetadataTaker2;
            console.log("nftMetadataTaker", nftMetadataTaker);

            if (tokenStandardTaker == TokenStandard.ProgrammableNonFungible) {
                const nftMasterEditionF = findNftMasterEdition({
                    mint: nftMintTaker,
                });
                console.log("nftMasterEditionF", nftMasterEditionF);

                const ownerTokenRecordF = findUserTokenRecord({
                    mint: nftMintTaker,
                    userMintAta: takerNftAta,
                });
                console.log("ownerTokenRecordF", ownerTokenRecordF);

                const destinationTokenRecordF = findUserTokenRecord({
                    mint: nftMintTaker,
                    userMintAta: makerNftAta,
                });
                console.log("destinationTokenRecordF", destinationTokenRecordF);

                const authRulesF = await findRuleSet({
                    connection,
                    mint: nftMintTaker,
                });
                console.log("authRulesF", authRulesF);

                nftMasterEditionTaker = nftMasterEditionF;
                ownerTokenRecordTaker = ownerTokenRecordF;
                destinationTokenRecordTaker = destinationTokenRecordF;
                authRulesTaker = authRulesF;
            }
        }
        console.log("bid", bidToscBid(bid));

        if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
            let amount = bid.takerNeoswapFee + bid.takerRoyalties;
            if (bid.amount > 0) amount += bid.amount;
            console.log("Wrapping " + amount + " lamports to wSOL");

            instructions.push(...addWSol(taker, takerTokenAta, amount));
        }

        const takeIx = await program.methods
            .takeSwap(bidToscBid(bid))
            .accounts({
                swapDataAccount: swapDataAccount,
                swapDataAccountTokenAta,

                maker,
                makerNftAta,
                makerTokenAta,

                taker: taker,
                takerNftAta,
                takerTokenAta,

                nftMintTaker: nftMintTaker,
                paymentMint: paymentMint,

                nftMetadataTaker,
                nftMasterEditionTaker,
                ownerTokenRecordTaker,
                destinationTokenRecordTaker,
                authRulesTaker,

                systemProgram: SystemProgram.programId,
                metadataProgram: TOKEN_METADATA_PROGRAM,
                sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
                ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
            })
            .instruction();
        instructions.push(takeIx);

        return {
            tx: await ix2vTx(instructions, cEnvOpts, taker),
            description: DESC.takeSwap,
            details: takeArgs,
            priority: 0,
            status: "pending",
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
