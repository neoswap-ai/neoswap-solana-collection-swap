import { getProgram } from "../utils/getProgram.obj";
import { getSdaData } from "../utils/getSdaData.function";
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
import { getCNFTOwner } from "../utils/getCNFTData.function";
import { TOKEN_PROGRAM_ID, createSyncNativeInstruction } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
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

export async function createTakeSwapInstructions(
    Data: TakeSArg & EnvOpts
): Promise<BundleTransaction> {
    if (Data.program && Data.clusterOrUrl) {
    } else if (!Data.program && Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!Data.clusterOrUrl && Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }

    let connection = Data.program.provider.connection;
    let dummyBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program: Data.program,
            swapDataAccount: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount;
        const { paymentMint, maker, nftMintMaker, bids } = swapDataData;
        console.log("bids", bids);

        const foundBid = bids.find(
            (b) =>
                b.amount === Data.bid.amount &&
                b.collection === Data.bid.collection &&
                b.takerNeoswapFee === Data.bid.takerNeoswapFee &&
                b.takerRoyalties === Data.bid.takerRoyalties &&
                b.makerRoyalties === Data.bid.makerRoyalties &&
                b.makerNeoswapFee === Data.bid.makerNeoswapFee
        );
        if (!foundBid)
            throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(bids)} `;

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintTaker,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tn) {
            instructions.push(tn);
            console.log("takerNftAta", takerNftAta);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tt) {
            instructions.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintTaker,
            owner: maker,
            signer: Data.taker,
        });
        if (mn) {
            instructions.push(mn);
            console.log("makerNftAta", makerNftAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: Data.taker,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.swapDataAccount,
            signer: Data.taker,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);
        }

        const { metadataAddress: nftMetadataTaker, tokenStandard: tokenStandardTaker } =
            await findNftDataAndMetadataAccount({
                connection,
                mint: Data.nftMintTaker,
            });
        console.log("nftMetadataTaker", nftMetadataTaker);

        let nftMasterEditionTaker = Data.taker;
        let ownerTokenRecordTaker = Data.taker;
        let destinationTokenRecordTaker = Data.taker;
        let authRulesTaker = Data.taker;

        if (tokenStandardTaker == TokenStandard.ProgrammableNonFungible) {
            const nftMasterEditionF = findNftMasterEdition({
                mint: Data.nftMintTaker,
            });
            console.log("nftMasterEditionF", nftMasterEditionF);

            const ownerTokenRecordF = findUserTokenRecord({
                mint: Data.nftMintTaker,
                userMintAta: takerNftAta,
            });
            console.log("ownerTokenRecordF", ownerTokenRecordF);

            const destinationTokenRecordF = findUserTokenRecord({
                mint: Data.nftMintTaker,
                userMintAta: makerNftAta,
            });
            console.log("destinationTokenRecordF", destinationTokenRecordF);

            const authRulesF = await findRuleSet({
                connection,
                mint: Data.nftMintTaker,
            });
            console.log("authRulesF", authRulesF);

            nftMasterEditionTaker = nftMasterEditionF;
            ownerTokenRecordTaker = ownerTokenRecordF;
            destinationTokenRecordTaker = destinationTokenRecordF;
            authRulesTaker = authRulesF;
        }
        console.log("bid", bidToscBid(Data.bid));

        if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
            let amount = Data.bid.takerNeoswapFee + Data.bid.takerRoyalties;
            if (Data.bid.amount > 0) amount += Data.bid.amount;
            console.log("Wrapping " + amount + " lamports to wSOL");

            instructions.push(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(Data.taker),
                    toPubkey: new PublicKey(takerTokenAta),
                    lamports: amount,
                }),
                createSyncNativeInstruction(new PublicKey(takerTokenAta))
            );
        }

        const takeIx = await Data.program.methods
            .takeSwap(bidToscBid(Data.bid))
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                swapDataAccountTokenAta,

                maker,
                makerNftAta,
                makerTokenAta,

                taker: Data.taker,
                takerNftAta,
                takerTokenAta,

                nftMintTaker: Data.nftMintTaker,
                mintToken: paymentMint,

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

        const tx = new Transaction().add(...instructions);
        tx.feePayer = new PublicKey(Data.taker);
        tx.recentBlockhash = dummyBlockhash;
        // // let simu = await connection.simulateTransaction(tx);
        // // console.log("simu", simu.value);
        // const txSig = await connection.sendTransaction(tx, [maker]);
        // console.log("txSig", txSig);

        return {
            tx: new VersionedTransaction(tx.compileMessage()),
            description: DESC.takeSwap,
            details: {
                bid: Data.bid,
                nftMintTaker: Data.nftMintTaker,
                swapDataAccount: Data.swapDataAccount,
                taker: Data.taker,
            },
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
            swapDataAccount: Data.swapDataAccount,
        };
    }
}
