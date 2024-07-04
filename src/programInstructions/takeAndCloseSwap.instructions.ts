import { getSdaData } from "../utils/getSdaData.function";
import {
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { BTv, BundleTransaction, EnvOpts, TakeSArg } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    FAIR_LAUNCH_PROGRAM_ID,
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
    let { taker, swapDataAccount, bid, nftMintTaker, verifyTaker, signer } = takeArgs;

    if (!signer) {
        console.log("no signer");
        signer = taker;
    }

    let takeAndClaimTx: VersionedTransaction | undefined;
    let payRAndCloseSTx: VersionedTransaction | undefined;
    // let claimSwapTx: VersionedTransaction | undefined;

    let takeAndClaimIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 8_500_000,
        }),
    ];
    // let payRAndCloseSIxs: TransactionInstruction[] = [
    //     ComputeBudgetProgram.setComputeUnitLimit({
    //         units: 800_000,
    //     }),
    // ];
    // let takeAndClaimIxs: TransactionInstruction[] = [
    //     ComputeBudgetProgram.setComputeUnitLimit({
    //         units: 900_000,
    //     }),
    // ];
    let payRAndCloseSIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 8_500_000,
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
            royaltiesPaidMaker,
            royaltiesPaidTaker,
            // taker,
        } = swapDataData;

        if (verifyTaker && swapDataData.taker && swapDataData.taker !== taker)
            throw "signer is not the taker of this swap";

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

        let nftMasterEditionTaker = signer;
        let ownerTokenRecordTaker = signer;
        let destinationTokenRecordTaker = signer;
        let authRulesTaker = signer;
        let nftMetadataTaker = signer;

        let nftMasterEditionMaker = signer;
        let ownerTokenRecordMaker = signer;
        let destinationTokenRecordMaker = signer;
        let authRulesMaker = signer;
        let nftMetadataMaker = signer;

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: taker,
            signer,
        });
        // console.log(nftMintTaker, "takerTokenProg", takerTokenProg);
        let takerTokenProg = (
            await connection.getAccountInfo(new PublicKey(nftMintTaker))
        )?.owner.toString();

        console.log(
            nftMintTaker,
            "takerTokenProg",
            takerTokenProg == TOKEN_PROGRAM_ID.toString()
                ? "native"
                : takerTokenProg == TOKEN_2022_PROGRAM_ID.toString()
                ? "2022"
                : "inknown"
        );

        let makerTokenProg = (
            await connection.getAccountInfo(new PublicKey(nftMintMaker))
        )?.owner.toString();

        console.log(
            nftMintMaker,
            "makerTokenProg",
            makerTokenProg == TOKEN_PROGRAM_ID.toString()
                ? "native"
                : makerTokenProg == TOKEN_2022_PROGRAM_ID.toString()
                ? "2022"
                : "inknown"
        );

        if (tn) {
            takeAndClaimIxs.push(tn);
        } else console.log("takerNftAta", takerNftAta);

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer,
        });
        if (tt) {
            takeAndClaimIxs.push(tt);
        } else console.log("takerTokenAta", takerTokenAta);

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: maker,
            signer,
        });
        if (mn) {
            takeAndClaimIxs.push(mn);
        } else console.log("makerNftAta", makerNftAta);

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer,
        });
        if (mt) {
            takeAndClaimIxs.push(mt);
        } else console.log("makerTokenAta", makerTokenAta);

        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer,
        });
        if (sdat) {
            takeAndClaimIxs.push(sdat);
        } else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

        if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
            // console.log(takerTokenProg, "nftMintTaker findNftDataAndMetadataAccount", nftMintTaker);

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

        console.log("bid", bid);

        if (!acceptedBid) {
            if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
                let amount = bid.takerNeoswapFee + bid.takerRoyalties;
                if (bid.amount > 0) amount += bid.amount;
                console.log("Wrapping " + amount + " lamports to wSOL");

                takeAndClaimIxs.push(...addWSol(taker, takerTokenAta, amount));
            }
            if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
                const takeIx = await program.methods
                    .takeSwap(bidToscBid(bid))
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
                takeAndClaimIxs.push(takeIx);
            } else {
                let hashlistMarker = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("hashlist_marker"),
                        new PublicKey(bid.collection).toBuffer(),
                        new PublicKey(nftMintTaker).toBuffer(),
                    ],
                    new PublicKey(FAIR_LAUNCH_PROGRAM_ID)
                )[0].toString();
                console.log("hashlistMarker", hashlistMarker);

                const takeIx = await program.methods
                    .takeSwap22(bidToscBid(Data.bid))
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

                        hashlistMarker,

                        systemProgram: SystemProgram.programId,
                        // metadataProgram: TOKEN_METADATA_PROGRAM,
                        // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                        ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                        // authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    })
                    .instruction();
                takeAndClaimIxs.push(takeIx);
            }
        }

        let { mintAta: swapDataAccountNftAta, instruction: sdan } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: swapDataAccount,
            signer,
        });
        let { mintAta: takerNftAtaMaker, instruction: tmn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: taker,
            signer,
        });

        if (makerTokenProg === TOKEN_PROGRAM_ID.toString()) {
            // console.log(makerTokenProg, "nftMintTaker findNftDataAndMetadataAccount", nftMintTaker);

            const { metadataAddress: nftMetadataMaker2, tokenStandard: tokenStandardMaker } =
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintMaker,
                });
            nftMetadataMaker = nftMetadataMaker2;
            console.log("nftMetadataMaker", nftMetadataMaker);

            if (tokenStandardMaker == TokenStandard.ProgrammableNonFungible) {
                const nftMasterEditionF = findNftMasterEdition({
                    mint: nftMintMaker,
                });
                console.log("nftMasterEditionF", nftMasterEditionF);

                const ownerTokenRecordF = findUserTokenRecord({
                    mint: nftMintMaker,
                    userMintAta: swapDataAccountNftAta,
                });
                console.log("ownerTokenRecordF", ownerTokenRecordF);

                const destinationTokenRecordF = findUserTokenRecord({
                    mint: nftMintMaker,
                    userMintAta: takerNftAtaMaker,
                });
                console.log("destinationTokenRecordF", destinationTokenRecordF);

                const authRulesF = await findRuleSet({
                    connection,
                    mint: nftMintMaker,
                });
                console.log("authRulesF", authRulesF);

                nftMasterEditionMaker = nftMasterEditionF;
                ownerTokenRecordMaker = ownerTokenRecordF;
                destinationTokenRecordMaker = destinationTokenRecordF;
                authRulesMaker = authRulesF;
            }
        }

        console.log("royaltiesPaidTaker", royaltiesPaidTaker);
        if (!royaltiesPaidTaker) {
            console.log(
                "royaltiesPaidTaker - makerTokenProg",
                makerTokenProg == TOKEN_PROGRAM_ID.toString()
                    ? "native"
                    : makerTokenProg == TOKEN_2022_PROGRAM_ID.toString()
                    ? "2022"
                    : "inknown"
            );
            if (makerTokenProg === TOKEN_PROGRAM_ID.toString()) {
                let {
                    creators: makerCreator,
                    creatorTokenAta: makerCreatorTokenAta,

                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintMaker,
                    paymentMint,
                    owner: swapDataAccount,
                    signer,
                });

                if (creatorIxs.length > 0) {
                    console.log("creatorIxs", creatorIxs.length);
                    payRAndCloseSIxs.push(...creatorIxs);
                }

                const payRIx = await program.methods
                    .payTakerRoyalties()
                    .accounts({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        paymentMint,

                        signer,

                        nftMetadataMaker,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram: TOKEN_PROGRAM_ID.toString(),

                        makerCreator0: makerCreator[0],
                        makerCreator0TokenAta: makerCreatorTokenAta[0],
                        makerCreator1: makerCreator[1],
                        makerCreator1TokenAta: makerCreatorTokenAta[1],
                        makerCreator2: makerCreator[2],
                        makerCreator2TokenAta: makerCreatorTokenAta[2],
                        makerCreator3: makerCreator[3],
                        makerCreator3TokenAta: makerCreatorTokenAta[3],
                        makerCreator4: makerCreator[4],
                        makerCreator4TokenAta: makerCreatorTokenAta[4],
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
                console.log("payRIx", payRIx);
            } else {
                const payRIx = await program.methods
                    .payTakerRoyalties22()
                    .accounts({
                        swapDataAccount,
                        nftMintMaker,

                        signer,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
            }
        }

        console.log("royaltiesPaidMaker", royaltiesPaidMaker);
        if (!royaltiesPaidMaker) {
            if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
                console.log(
                    "takerTokenProg",
                    takerTokenProg == TOKEN_PROGRAM_ID.toString()
                        ? "native"
                        : takerTokenProg == TOKEN_2022_PROGRAM_ID.toString()
                        ? "2022"
                        : "inknown"
                );

                let {
                    creators: takerCreator,
                    creatorTokenAta: takerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    paymentMint,
                    owner: swapDataAccount,
                    signer,
                    nftMint: nftMintTaker,
                });

                if (creatorIxs) payRAndCloseSIxs.push(...creatorIxs);

                // let nftMetadataTaker = (
                //     await findNftDataAndMetadataAccount({
                //         connection,
                //         mint: nftMintTaker,
                //     })
                // ).metadataAddress;

                const payRIx = await program.methods
                    .payMakerRoyalties()
                    .accounts({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        paymentMint,

                        signer,

                        nftMetadataTaker,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram: TOKEN_PROGRAM_ID,

                        takerCreator0: takerCreator[0],
                        takerCreator0TokenAta: takerCreatorTokenAta[0],
                        takerCreator1: takerCreator[1],
                        takerCreator1TokenAta: takerCreatorTokenAta[1],
                        takerCreator2: takerCreator[2],
                        takerCreator2TokenAta: takerCreatorTokenAta[2],
                        takerCreator3: takerCreator[3],
                        takerCreator3TokenAta: takerCreatorTokenAta[3],
                        takerCreator4: takerCreator[4],
                        takerCreator4TokenAta: takerCreatorTokenAta[4],
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
            } else {
                console.log("payMakerRoyalties22 signer,", signer);

                const payRIx = await program.methods
                    .payMakerRoyalties22()
                    .accounts({
                        swapDataAccount,
                        nftMintTaker,
                        signer,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
            }
        }

        ///////////////////////////////////

        if (sdan) takeAndClaimIxs.push(sdan);
        else console.log("swapDataAccountNftAta", swapDataAccountNftAta);

        if (tmn) takeAndClaimIxs.push(tmn);
        else console.log("takerNftAta", takerNftAtaMaker);

        if (
            !!acceptedBid
            // && !!royaltiesPaidMaker && !!royaltiesPaidTaker
        ) {
            // if (mt) takeAndClaimIxs.push(mt);
            // else console.log("makerTokenAta", makerTokenAta);

            if (tt) takeAndClaimIxs.push(tt);
            else console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer,
        });
        if (nst) takeAndClaimIxs.push(nst);
        else console.log("nsFeeTokenAta", nsFeeTokenAta);

        if (makerTokenProg === TOKEN_PROGRAM_ID.toString()) {
            console.log();

            const claimIx = await program.methods
                .claimSwap()
                .accounts({
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
                    tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                })
                .instruction();

            takeAndClaimIxs.push(claimIx);
        } else {
            console.log("signer", signer);
            console.log("taker", taker);

            const claimIx = await program.methods
                .claimSwap22()
                .accounts({
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
                    // makerNftAta,
                    makerTokenAta,

                    nftMintMaker,
                    paymentMint,

                    systemProgram: SystemProgram.programId,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                })
                .instruction();

            takeAndClaimIxs.push(claimIx);
        }

        const closeIx = await program.methods
            .closeSwap()
            .accounts({
                swapDataAccount,
                swapDataAccountTokenAta,

                maker,
                makerTokenAta,

                paymentMint,
                signer,

                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        payRAndCloseSIxs.push(closeIx);

        if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString())
            if (signer === taker) payRAndCloseSIxs.push(closeWSol(taker, taker, takerTokenAta));
            else if (signer === maker)
                payRAndCloseSIxs.push(closeWSol(maker, maker, makerTokenAta));

        let { lastValidBlockHeight: blockheight, blockhash } =
            await connection.getLatestBlockhash();

        // if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString() && signer == taker)
        //     closeSIxs.push(closeWSol(Data.taker, taker, takerTokenAta));

        takeAndClaimTx = await ix2vTx(takeAndClaimIxs, cEnvOpts, signer);

        let bTTakeAndClose: BTv[] = [];
        let priority = 0;

        if (takeAndClaimTx) {
            bTTakeAndClose.push({
                tx: takeAndClaimTx,
                description: DESC.takeSwap,
                details: takeArgs,
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no takeSwapTx");

        payRAndCloseSTx = await ix2vTx(payRAndCloseSIxs, cEnvOpts, signer);

        if (payRAndCloseSTx) {
            bTTakeAndClose.push({
                tx: payRAndCloseSTx,
                description: DESC.payRoyalties,
                details: takeArgs,
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no payRoyaltiesTx");

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
