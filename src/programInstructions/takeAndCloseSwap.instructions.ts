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
            royaltiesPaidMaker,
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

        let nftMasterEditionTaker = taker;
        let ownerTokenRecordTaker = taker;
        let destinationTokenRecordTaker = taker;
        let authRulesTaker = taker;
        let nftMetadataTaker = taker;

        let nftMasterEditionMaker = taker;
        let ownerTokenRecordMaker = taker;
        let destinationTokenRecordMaker = taker;
        let authRulesMaker = taker;
        let nftMetadataMaker = taker;

        let {
            mintAta: takerNftAta,
            instruction: tn,
            tokenProgram: takerTokenProg,
        } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: taker,
            signer: taker,
        });
        // console.log(nftMintTaker, "takerTokenProg", takerTokenProg);
        console.log(
            nftMintTaker,
            "takerTokenProg",
            takerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
        );

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
        console.log(
            nftMintTaker,
            "takerTokenProg",
            takerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
        );

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
        console.log(
            nftMintTaker,
            "takerTokenProg",
            takerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
        );

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
        console.log(
            nftMintTaker,
            "takerTokenProg",
            takerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
        );

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
        console.log(
            nftMintTaker,
            "takerTokenProg",
            takerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
        );
        let {
            mintAta: swapDataAccountNftAta,
            instruction: sdan,
            tokenProgram: makerTokenProg,
        } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: swapDataAccount,
            signer: taker,
        });
        if (makerTokenProg === TOKEN_PROGRAM_ID.toString()) {
            console.log(
                nftMintMaker,
                "makerTokenProg findNftDataAndMetadataAccount",
                makerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
            );
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
                    userMintAta: makerNftAta,
                });
                console.log("ownerTokenRecordF", ownerTokenRecordF);

                const destinationTokenRecordF = findUserTokenRecord({
                    mint: nftMintMaker,
                    userMintAta: makerNftAta,
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
        if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
            console.log(
                nftMintTaker,
                "takerTokenProg findNftDataAndMetadataAccount",
                takerTokenProg == TOKEN_PROGRAM_ID.toString() ? "native" : "2022"
            );
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
                if (Data.bid.amount > 0) amount += bid.amount;
                console.log("Wrapping " + amount + " lamports to wSOL");

                takeIxs.push(...addWSol(Data.taker, takerTokenAta, amount));
            }
            if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
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
                takeIxs.push(takeIx);
            }
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
        let makerCreator: string[] = [taker, taker, taker];
        let makerCreatorTokenAta: string[] = [takerNftAta, takerNftAta, takerNftAta];
        let takerCreator: string[] = [taker, taker, taker];
        let takerCreatorTokenAta: string[] = [takerNftAta, takerNftAta, takerNftAta];
        if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
            let {
                makerCreator: makerCreator2,
                makerCreatorTokenAta: makerCreatorTokenAta2,
                takerCreator: takerCreator2,
                takerCreatorTokenAta: takerCreatorTokenAta2,
                instructions: creatorIxs,
            } = await getCreatorData({
                connection,
                nftMintMaker,
                paymentMint,
                taker,
                signer: taker,
                nftMintTaker: nftMintTaker,
            });

            makerCreator = makerCreator2;
            makerCreatorTokenAta = makerCreatorTokenAta2;
            takerCreator = takerCreator2;
            takerCreatorTokenAta = takerCreatorTokenAta2;

            if (creatorIxs) payRIxs.push(...creatorIxs);
        }

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

        // const { metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
        //     await findNftDataAndMetadataAccount({
        //         connection,
        //         mint: nftMintMaker,
        //     });
        // console.log("nftMetadataMaker", nftMetadataMaker);

        if (!royaltiesPaidMaker) {
            if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
                let nftMetadataMaker = (
                    await findNftDataAndMetadataAccount({
                        connection,
                        mint: nftMintMaker,
                    })
                ).metadataAddress;
                // console.log("nftMetadataMaker", nftMetadataMaker);

                let nftMetadataTaker = (
                    await findNftDataAndMetadataAccount({
                        connection,
                        mint: nftMintTaker,
                    })
                ).metadataAddress;

                const payRIx = await program.methods
                    .payRoyalties()
                    .accounts({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        signer: taker,

                        paymentMint,

                        nftMetadataTaker,
                        nftMetadataMaker,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram: TOKEN_PROGRAM_ID,

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
            } else {
                const payRIx = await program.methods
                    .payRoyalties22()
                    .accounts({
                        swapDataAccount,
                        nftMintTaker,
                        nftMintMaker,

                        signer: taker,

                        metadataProgram: TOKEN_METADATA_PROGRAM,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    })
                    .instruction();
                payRIxs.push(payRIx);
            }
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

        if (takerTokenProg === TOKEN_PROGRAM_ID.toString()) {
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
                    tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                })
                .instruction();

            claimSIxs.push(initIx);
        } else {
            const initIx = await program.methods
                .claimSwap22()
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

                    systemProgram: SystemProgram.programId,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                })
                .instruction();

            claimSIxs.push(initIx);
        }

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
                description: DESC.takeSwap,
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
                description: DESC.payRoyalties,
                details: takeArgs,
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no payRoyaltiesTx");

        bTTakeAndClose.push({
            tx: claimSwapTx,
            description: DESC.claimSwap,
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
