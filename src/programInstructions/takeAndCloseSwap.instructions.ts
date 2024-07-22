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
    getCoreCollection,
    getHashlistMarker,
    whichStandard,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { getCreatorData } from "../utils/creators";
import { bidToscBid } from "../utils/typeSwap";
import { DESC } from "../utils/descriptions";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol, closeWSol } from "../utils/wsol";
import { ix2vTx } from "../utils/vtx";
import { checkEnvOpts, getTakeArgs } from "../utils/check";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";

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

    let takeAndClaimIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 8_500_000,
        }),
    ];

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
            throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(bids)} `;

        // finding which standard the nfts are
        let makerNftStd = await whichStandard({ connection, mint: nftMintMaker });
        let takerNftStd = await whichStandard({ connection, mint: nftMintTaker });

        //
        // finding payment ATAs
        //

        let { mintAta: takerTokenAta, instruction: takerTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer,
        });
        if (takerTokenIx) takeAndClaimIxs.push(takerTokenIx);
        else console.log("takerTokenAta", takerTokenAta);

        let { mintAta: swapDataAccountTokenAta, instruction: sdaTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer,
        });
        if (sdaTokenIx) takeAndClaimIxs.push(sdaTokenIx);
        else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

        let { mintAta: makerTokenAta, instruction: makerTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer,
        });
        if (makerTokenIx) takeAndClaimIxs.push(makerTokenIx);
        else console.log("makerTokenAta", makerTokenAta);

        let { mintAta: nsFeeTokenAta, instruction: nsTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer,
        });
        if (nsTokenIx) takeAndClaimIxs.push(nsTokenIx);
        else console.log("nsFeeTokenAta", nsFeeTokenAta);

        //
        // Getting metadata Maker Nft
        //

        let nftMetadataMaker: string | null = null;
        let tokenStandardMaker: number | null = null;

        if (makerNftStd === "native") {
            console.log("makerNftStdmakerNftStdmakerNftStdmakerNftStdmakerNftStd", makerNftStd);

            const { metadataAddress: nftMetadataMaker2, tokenStandard: tokenStandardMaker2 } =
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintMaker,
                });
            nftMetadataMaker = nftMetadataMaker2;
            tokenStandardMaker = tokenStandardMaker2 ? tokenStandardMaker2 : null;
            console.log("nftMetadataMaker", nftMetadataMaker);
        }

        //
        // Getting metadata Taker Nft
        //

        let nftMetadataTaker: string | null = null;
        let tokenStandardTaker: number | null = null;

        if (takerNftStd === "native") {
            const { metadataAddress: nftMetadataTaker2, tokenStandard: tokenStandardTaker2 } =
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintTaker,
                });
            nftMetadataTaker = nftMetadataTaker2;
            tokenStandardTaker = tokenStandardTaker2 ? tokenStandardTaker2 : null;
            console.log("nftMetadataTaker", nftMetadataTaker);
        }

        //
        // taking Swap
        //

        if (!acceptedBid) {
            if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
                let amount = bid.takerNeoswapFee + bid.takerRoyalties;
                if (bid.amount > 0) amount += bid.amount;
                console.log("Wrapping " + amount + " lamports to wSOL");

                takeAndClaimIxs.push(...addWSol(taker, takerTokenAta, amount));
            }
            if (takerNftStd == "core") {
                let takerCoreCollection = await getCoreCollection({
                    connection,
                    mint: nftMintTaker,
                });
                const takeIx = await program.methods
                    .takeSwapCore(bidToscBid(bid))
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        maker,
                        makerTokenAta,

                        taker,
                        takerTokenAta,

                        nftMintTaker,
                        paymentMint,

                        collection: takerCoreCollection,

                        coreProgram: MPL_CORE_PROGRAM_ID,
                        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                takeAndClaimIxs.push(takeIx);
            } else {
                let { mintAta: makerNftAta, instruction: makerAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintTaker,
                        owner: maker,
                        signer,
                    });
                if (makerAtaMakerNftIx) takeAndClaimIxs.push(makerAtaMakerNftIx);
                else console.log("makerNftAta", makerNftAta);

                let { mintAta: takerNftAta, instruction: takerAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintTaker,
                        owner: taker,
                        signer,
                    });
                if (takerAtaMakerNftIx) takeAndClaimIxs.push(takerAtaMakerNftIx);
                else console.log("takerNftAta", takerNftAta);

                if (takerNftStd === "native") {
                    let nftMasterEditionTaker: string | null = null;
                    let ownerTokenRecordTaker: string | null = null;
                    let destinationTokenRecordTaker: string | null = null;
                    let authRulesTaker: string | null = null;

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

                    if (!nftMetadataTaker)
                        nftMetadataTaker = (
                            await findNftDataAndMetadataAccount({
                                connection,
                                mint: nftMintTaker,
                            })
                        ).metadataAddress;

                    const takeIx = await program.methods
                        .takeSwap(bidToscBid(bid))
                        .accountsStrict({
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
                    let makerhashlistMarker = await getHashlistMarker({
                        collection: Data.bid.collection,
                        nftMintTaker,
                    });
                    console.log("makerhashlistMarker", makerhashlistMarker);

                    const takeIx = await program.methods
                        .takeSwap22(bidToscBid(Data.bid))
                        .accountsStrict({
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

                            hashlistMarker: makerhashlistMarker,

                            systemProgram: SystemProgram.programId,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            tokenProgram22: TOKEN_2022_PROGRAM_ID,
                            ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                        })
                        .instruction();
                    takeAndClaimIxs.push(takeIx);
                }
            }
        }

        if (!claimed) {
            if (makerNftStd === "core") {
                let coreCollection = await getCoreCollection({ mint: nftMintMaker, connection });
                const claimCoreIx = await program.methods
                    .claimSwapCore()
                    .accountsStrict({
                        ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                        nsFee: NS_FEE,
                        nsFeeTokenAta,
                        signer,
                        taker,
                        takerTokenAta,
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
                takeAndClaimIxs.push(claimCoreIx);
            } else {
                let { mintAta: swapDataAccountNftAta, instruction: sdaAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintMaker,
                        owner: swapDataAccount,
                        signer,
                    });
                if (sdaAtaMakerNftIx) takeAndClaimIxs.push(sdaAtaMakerNftIx);
                else console.log("swapDataAccountNftAta", swapDataAccountNftAta);

                let { mintAta: takerNftAtaMaker, instruction: takerAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintMaker,
                        owner: taker,
                        signer,
                    });
                if (takerAtaMakerNftIx) takeAndClaimIxs.push(takerAtaMakerNftIx);
                else console.log("takerNftAta", takerNftAtaMaker);

                if (makerNftStd === "native") {
                    let nftMasterEditionMaker: string | null = null;
                    let ownerTokenRecordMaker: string | null = null;
                    let destinationTokenRecordMaker: string | null = null;
                    let authRulesMaker: string | null = null;

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
                    if (!nftMetadataMaker)
                        nftMetadataMaker = (
                            await findNftDataAndMetadataAccount({
                                connection,
                                mint: nftMintMaker,
                            })
                        ).metadataAddress;

                    const claimIx = await program.methods
                        .claimSwap()
                        .accountsStrict({
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

                    takeAndClaimIxs.push(claimIx);
                } else {
                    console.log("signer", signer);
                    console.log("taker", taker);

                    const claimIx = await program.methods
                        .claimSwap22()
                        .accountsStrict({
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
            }
        }

        //
        // Paying royalties Taker
        //

        if (!royaltiesPaidTaker) {
            console.log("royaltiesPaidTaker - takerTokenProg", makerNftStd);
            if (makerNftStd === "core") {
                let {
                    creators: makerCreators,
                    creatorTokenAta: makerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintMaker,
                    isCore: true,
                    owner: swapDataAccount,
                    paymentMint,
                    signer,
                });
                let payTakerCoreIx = await program.methods
                    .payRoyaltiesCore()
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        nftMint: nftMintMaker,
                        paymentMint,
                        signer,
                        makerCreator0: makerCreators[0],
                        makerCreator0TokenAta: makerCreatorTokenAta[0],
                        makerCreator1: makerCreators[1],
                        makerCreator1TokenAta: makerCreatorTokenAta[1],
                        makerCreator2: makerCreators[2],
                        makerCreator2TokenAta: makerCreatorTokenAta[2],
                        makerCreator3: makerCreators[3],
                        makerCreator3TokenAta: makerCreatorTokenAta[3],
                        makerCreator4: makerCreators[4],
                        makerCreator4TokenAta: makerCreatorTokenAta[4],
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                payRAndCloseSIxs.push(...creatorIxs);
                payRAndCloseSIxs.push(payTakerCoreIx);
            } else if (makerNftStd === "native") {
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
                    isCore: false,
                });

                if (creatorIxs.length > 0) {
                    console.log("creatorIxs", creatorIxs.length);
                    payRAndCloseSIxs.push(...creatorIxs);
                }

                if (!nftMetadataMaker)
                    nftMetadataMaker = (
                        await findNftDataAndMetadataAccount({
                            connection,
                            mint: nftMintMaker,
                        })
                    ).metadataAddress;

                const payRIx = await program.methods
                    .payRoyalties()
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        paymentMint,

                        signer,

                        nftMetadata: nftMetadataMaker,
                        nftMint: nftMintMaker,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram: TOKEN_PROGRAM_ID.toString(),

                        creator0: makerCreator[0],
                        creator0TokenAta: makerCreatorTokenAta[0],
                        creator1: makerCreator[1],
                        creator1TokenAta: makerCreatorTokenAta[1],
                        creator2: makerCreator[2],
                        creator2TokenAta: makerCreatorTokenAta[2],
                        creator3: makerCreator[3],
                        creator3TokenAta: makerCreatorTokenAta[3],
                        creator4: makerCreator[4],
                        creator4TokenAta: makerCreatorTokenAta[4],
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
                console.log("payRIx", payRIx);
            } else {
                const payRIx = await program.methods
                    .payRoyalties22()
                    .accountsStrict({
                        swapDataAccount,
                        nftMint: nftMintMaker,

                        signer,

                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
            }
        }

        //
        // Paying royalties maker
        //

        if (!royaltiesPaidMaker) {
            console.log("royaltiesPaidMaker - takerTokenProg", takerNftStd);

            if (takerNftStd === "core") {
                let {
                    creators: makerCreators,
                    creatorTokenAta: makerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintTaker,
                    isCore: true,
                    owner: swapDataAccount,
                    paymentMint,
                    signer,
                });
                let payTakerCoreIx = await program.methods
                    .payRoyaltiesCore()
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        nftMint: nftMintTaker,
                        paymentMint,
                        signer,
                        makerCreator0: makerCreators[0],
                        makerCreator0TokenAta: makerCreatorTokenAta[0],
                        makerCreator1: makerCreators[1],
                        makerCreator1TokenAta: makerCreatorTokenAta[1],
                        makerCreator2: makerCreators[2],
                        makerCreator2TokenAta: makerCreatorTokenAta[2],
                        makerCreator3: makerCreators[3],
                        makerCreator3TokenAta: makerCreatorTokenAta[3],
                        makerCreator4: makerCreators[4],
                        makerCreator4TokenAta: makerCreatorTokenAta[4],
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                payRAndCloseSIxs.push(...creatorIxs);
                payRAndCloseSIxs.push(payTakerCoreIx);
            } else if (takerNftStd === "native") {
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
                    isCore: false,
                });

                if (creatorIxs) payRAndCloseSIxs.push(...creatorIxs);

                if (!nftMetadataTaker)
                    nftMetadataTaker = (
                        await findNftDataAndMetadataAccount({
                            connection,
                            mint: nftMintTaker,
                        })
                    ).metadataAddress;

                const payRIx = await program.methods
                    .payRoyalties()
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        paymentMint,

                        signer,

                        nftMint: nftMintTaker,
                        nftMetadata: nftMetadataTaker,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram: TOKEN_PROGRAM_ID,

                        creator0: takerCreator[0],
                        creator0TokenAta: takerCreatorTokenAta[0],
                        creator1: takerCreator[1],
                        creator1TokenAta: takerCreatorTokenAta[1],
                        creator2: takerCreator[2],
                        creator2TokenAta: takerCreatorTokenAta[2],
                        creator3: takerCreator[3],
                        creator3TokenAta: takerCreatorTokenAta[3],
                        creator4: takerCreator[4],
                        creator4TokenAta: takerCreatorTokenAta[4],
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
            } else {
                console.log("payMakerRoyalties22 signer,", signer);

                const payRIx = await program.methods
                    .payRoyalties22()
                    .accountsStrict({
                        swapDataAccount,
                        nftMint: nftMintTaker,
                        signer,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    })
                    .instruction();
                payRAndCloseSIxs.push(payRIx);
            }
        }

        //
        // Closing
        //

        const closeIx = await program.methods
            .closeSwap()
            .accountsStrict({
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

        if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
            if (signer === taker) payRAndCloseSIxs.push(closeWSol(taker, taker, takerTokenAta));
            else if (signer === maker)
                payRAndCloseSIxs.push(closeWSol(maker, maker, makerTokenAta));
        }

        let takeAndClaimTx: VersionedTransaction | undefined;

        if (!acceptedBid || !claimed)
            takeAndClaimTx = await ix2vTx(takeAndClaimIxs, cEnvOpts, signer);

        let { lastValidBlockHeight: blockheight, blockhash } =
            await connection.getLatestBlockhash();

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

        bTTakeAndClose.push({
            tx: await ix2vTx(payRAndCloseSIxs, cEnvOpts, signer),
            description: DESC.payRoyalties,
            details: takeArgs,
            priority,
            status: "pending",
            blockheight,
        });

        bTTakeAndClose.map((b) => (b.tx.message.recentBlockhash = blockhash));

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
