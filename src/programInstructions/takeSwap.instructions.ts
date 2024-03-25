import { getProgram } from "../utils/getProgram.obj";
import {
    Cluster,
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { BundleTransaction, EnvOpts, ErrorFeedback, TakeSArg } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
    VERSION,
} from "../utils/const";
import { delay } from "../utils/delay";
import { BN } from "bn.js";
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
import { addPriorityFee } from "../utils/fees";
import { addWSol } from "../utils/wsol";
import { checkEnvOpts, getTakeArgs } from "../utils/check";
import { getSdaData } from "../utils/getSdaData.function";

export async function createTakeSwapInstructions(
    Data: TakeSArg & EnvOpts
): Promise<BundleTransaction> {
    console.log(VERSION);
    let cEnvOpts = checkEnvOpts(Data);
    let { program, prioritizationFee } = cEnvOpts;
    let takeSArg = getTakeArgs(Data);
    let { swapDataAccount, taker, bid, nftMintTaker } = takeSArg;

    let connection = program.provider.connection;

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program,
            swapDataAccount: swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;
        const { mintToken, maker, nftMintMaker, bids } = swapDataData;
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

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
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
            mint: mintToken,
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
            mint: mintToken,
            owner: maker,
            signer: taker,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: swapDataAccount,
            signer: taker,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);
        }

        const { metadataAddress: nftMetadataTaker, tokenStandard: tokenStandardTaker } =
            await findNftDataAndMetadataAccount({
                connection,
                mint: nftMintTaker,
            });
        console.log("nftMetadataTaker", nftMetadataTaker);

        let nftMasterEditionTaker = taker;
        let ownerTokenRecordTaker = taker;
        let destinationTokenRecordTaker = taker;
        let authRulesTaker = taker;

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
        console.log("bid", bidToscBid(bid));

        if (swapDataData.mintToken === WRAPPED_SOL_MINT.toString()) {
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
                mintToken: mintToken,

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

        let tx = new Transaction().add(...instructions);
        tx = await addPriorityFee(tx, prioritizationFee);
        tx.feePayer = new PublicKey(taker);
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // // let simu = await connection.simulateTransaction(tx);
        // // console.log("simu", simu.value);
        // const txSig = await connection.sendTransaction(tx, [maker]);
        // console.log("txSig", txSig);

        return {
            tx: new VersionedTransaction(tx.compileMessage()),
            description: DESC.takeSwap,
            details: Data,
            priority: 0,
            status: "pending",
        };
        // {
        //     tx,
        //     swapDataAccount,
        // };
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
