import { getSdaData } from "../utils/getSdaData.function";
import {
    ComputeBudgetProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { BTv, BundleTransaction, EnvOpts, TakeSArg } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
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
import { getCreatorData } from "../utils/creators";
import { bidToscBid } from "../utils/typeSwap";
import { DESC } from "../utils/descriptions";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol, closeWSol } from "../utils/wsol";
import { ix2vTx } from "../utils/vtx";
import { checkEnvOpts, getTakeArgs } from "../utils/check";

export async function createTakeAndCloseSwapInstructions(
    Data: TakeSArg & EnvOpts
): Promise<BundleTransaction[]> {
    console.log(VERSION);
    let cEnvOpts = await checkEnvOpts(Data);
    let takeArgs = getTakeArgs(Data);
    let { program, connection } = cEnvOpts;
    let { taker, swapDataAccount, bid, nftMintTaker } = takeArgs;
    let ataIxs: TransactionInstruction[] = [];
    let takeIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 8500000,
        }),
    ];
    try {
        let swapDataData = await getSdaData({
            program,
            swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;

        const {
            paymentMint: paymentMint,
            maker,
            nftMintMaker,
            bids,
            acceptedBid,
            royaltiesPaid,
        } = swapDataData;

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
            throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(bids)} `;

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: taker,
            signer: taker,
        });
        if (tn) {
            ataIxs.push(tn);
            console.log("takerNftAta", takerNftAta);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer: taker,
        });
        if (tt) {
            ataIxs.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: maker,
            signer: taker,
        });
        if (mn) {
            ataIxs.push(mn);
            console.log("makerNftAta", makerNftAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: taker,
        });
        if (mt) {
            ataIxs.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer: taker,
        });
        if (sdat) {
            ataIxs.push(sdat);
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
        console.log("bid", bid);

        if (!acceptedBid) {
            if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
                let amount = bid.takerNeoswapFee + bid.takerRoyalties;
                if (Data.bid.amount > 0) amount += bid.amount;
                console.log("Wrapping " + amount + " lamports to wSOL");

                takeIxs.push(...addWSol(Data.taker, takerTokenAta, amount));
            }
            const takeIx = await program.methods
                .takeSwap(bidToscBid(Data.bid))
                .accounts({
                    swapDataAccount,
                    swapDataAccountTokenAta,

                    maker,
                    makerNftAta,
                    makerTokenAta,

                    taker,
                    takerNftAta,
                    takerTokenAta,

                    nftMintTaker,
                    paymentMint,

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
            takeIxs.push(takeIx);
        }

        let takeSwapTx: VersionedTransaction | undefined;
        if (takeIxs.length > 1) {
            takeSwapTx = await ix2vTx(ataIxs.concat(takeIxs), cEnvOpts, taker);
            ataIxs = [];
        }

        let payRIxs: TransactionInstruction[] = [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 800000,
            }),
        ];

        let {
            makerCreator,
            makerCreatorTokenAta,
            takerCreator,
            takerCreatorTokenAta,
            instructions: creatorIxs,
        } = await getCreatorData({
            connection,
            nftMintMaker,
            paymentMint,
            taker,
            signer: taker,
            nftMintTaker: nftMintTaker,
        });
        if (creatorIxs) payRIxs.push(...creatorIxs);

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer: taker,
        });
        if (nst) {
            payRIxs.push(nst);
            console.log("nsFeeTokenAta", nsFeeTokenAta);
        }

        const { metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
            await findNftDataAndMetadataAccount({
                connection,
                mint: nftMintMaker,
            });
        console.log("nftMetadataMaker", nftMetadataMaker);

        if (!royaltiesPaid) {
            const payRIx = await program.methods
                .payRoyalties()
                .accounts({
                    swapDataAccount,
                    swapDataAccountTokenAta,

                    // maker,
                    // makerNftAta,
                    // makerTokenAta,
                    signer: taker,

                    // taker:taker,
                    // takerNftAta,
                    // takerTokenAta,

                    // nsFee: NS_FEE,
                    // nsFeeTokenAta,

                    // nftMintTaker:nftMintTaker,
                    paymentMint,

                    nftMetadataTaker,
                    nftMetadataMaker,

                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    // systemProgram: SystemProgram.programId,
                    // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    // ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    // authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,

                    makerCreator0: makerCreator[0],
                    makerCreator0TokenAta: makerCreatorTokenAta[0],
                    makerCreator1: makerCreator[1],
                    makerCreator1TokenAta: makerCreatorTokenAta[1],
                    makerCreator2: makerCreator[2],
                    makerCreator2TokenAta: makerCreatorTokenAta[2],
                    takerCreator0: takerCreator[0],
                    takerCreator0TokenAta: takerCreatorTokenAta[0],
                    takerCreator1: takerCreator[1],
                    takerCreator1TokenAta: takerCreatorTokenAta[1],
                    takerCreator2: takerCreator[2],
                    takerCreator2TokenAta: takerCreatorTokenAta[2],
                })
                .instruction();
            payRIxs.push(payRIx);
        }

        let payRoyaltiesTx: VersionedTransaction | undefined;
        if (payRIxs.length > 1) {
            payRoyaltiesTx = await ix2vTx(ataIxs.concat(payRIxs), cEnvOpts, taker);
            ataIxs = [];
        }

        ///////////////////////////////////

        let claimSIxs: TransactionInstruction[] = [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 800000,
            }),
        ];

        let { mintAta: swapDataAccountNftAta, instruction: sdan } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: swapDataAccount,
            signer: taker,
        });

        if (sdan) {
            claimSIxs.push(sdan);
            console.log("swapDataAccountNftAta", swapDataAccountNftAta);
        }

        let { mintAta: takerNftAtaMaker, instruction: tmn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: taker,
            signer: taker,
        });
        if (tmn) {
            claimSIxs.push(tmn);
            console.log("takerNftAta", takerNftAtaMaker);
        }

        let nftMasterEditionMaker = taker;
        let ownerTokenRecordMaker = taker;
        let destinationTokenRecordMaker = taker;
        let authRulesMaker = taker;

        if (tokenStandardMaker == TokenStandard.ProgrammableNonFungible) {
            const nftMasterEditionF = findNftMasterEdition({
                mint: nftMintMaker,
            });

            const ownerTokenRecordF = findUserTokenRecord({
                mint: nftMintMaker,
                userMintAta: swapDataAccountNftAta,
            });

            const destinationTokenRecordF = findUserTokenRecord({
                mint: nftMintMaker,
                userMintAta: takerNftAtaMaker,
            });

            const authRulesF = await findRuleSet({
                connection,
                mint: nftMintMaker,
            });
            nftMasterEditionMaker = nftMasterEditionF;
            ownerTokenRecordMaker = ownerTokenRecordF;
            destinationTokenRecordMaker = destinationTokenRecordF;
            authRulesMaker = authRulesF;
        }

        const initIx = await program.methods
            .claimSwap()
            .accounts({
                swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                nsFee: NS_FEE,
                nsFeeTokenAta,

                signer: taker,
                taker,
                takerNftAtaMaker,
                takerTokenAta,

                maker,
                // makerNftAta,
                makerTokenAta,

                nftMintMaker,
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
                ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
            })
            .instruction();

        claimSIxs.push(initIx);

        let { lastValidBlockHeight: blockheight, blockhash } =
            await connection.getLatestBlockhash();

        if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString())
            claimSIxs.push(closeWSol(Data.taker, taker, takerTokenAta));

        let claimSwapTx = await ix2vTx(ataIxs.concat(claimSIxs), cEnvOpts, taker);

        let bTTakeAndClose: BTv[] = [];
        let priority = 0;

        if (takeSwapTx) {
            bTTakeAndClose.push({
                tx: takeSwapTx,
                type: DESC.takeSwap,
                details: takeArgs,
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no takeSwapTx");

        if (payRoyaltiesTx) {
            bTTakeAndClose.push({
                tx: payRoyaltiesTx,
                type: DESC.payRoyalties,
                details: takeArgs,
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no payRoyaltiesTx");

        bTTakeAndClose.push({
            tx: claimSwapTx,
            type: DESC.claimSwap,
            details: takeArgs,
            priority,
            status: "pending",
            blockheight,
        });
        let bh = (await connection.getLatestBlockhash()).blockhash;
        bTTakeAndClose.map((b) => (b.tx.message.recentBlockhash = bh));
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
