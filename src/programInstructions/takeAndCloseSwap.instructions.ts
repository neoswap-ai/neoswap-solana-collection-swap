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
import {
    BTClaim,
    BTMake,
    BTTake,
    BTv,
    Bid,
    BundleTransaction,
    ClaimArg,
    EnvOpts,
    ErrorFeedback,
    MakeSArg,
    TakeSArg,
    TxWithSigner,
} from "../utils/types";
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
import { addPriorityFee } from "../utils/fees";
import { addWSol, closeWSol } from "../utils/wsol";
import { checkEnvOpts, getTakeArgs } from "../utils/check";

export async function createTakeAndCloseSwapInstructions(
    Data: TakeSArg & EnvOpts
): Promise<BundleTransaction[]> {
    console.log(VERSION);
    let cEnvOpts = checkEnvOpts(Data);
    let { program, prioritizationFee } = cEnvOpts;
    let takeSArg = getTakeArgs(Data);
    let { swapDataAccount, taker, bid, nftMintTaker } = takeSArg;
    let connection = program.provider.connection;

    let takeIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 8500000,
        }),
    ];
    try {
        let swapDataData = await getSdaData({
            program: program,
            swapDataAccount: swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;

        const {
            mintToken: mintToken,
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
            takeIxs.push(tn);
            console.log("takerNftAta", takerNftAta);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: taker,
            signer: taker,
        });
        if (tt) {
            takeIxs.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: maker,
            signer: taker,
        });
        if (mn) {
            takeIxs.push(mn);
            console.log("makerNftAta", makerNftAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: maker,
            signer: taker,
        });
        if (mt) {
            takeIxs.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: swapDataAccount,
            signer: taker,
        });
        if (sdat) {
            takeIxs.push(sdat);
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
            if (swapDataData.mintToken === WRAPPED_SOL_MINT.toString()) {
                let amount = bid.takerNeoswapFee + bid.takerRoyalties;
                if (Data.bid.amount > 0) amount += bid.amount;
                console.log("Wrapping " + amount + " lamports to wSOL");

                takeIxs.push(...addWSol(Data.taker, takerTokenAta, amount));
            }
            const takeIx = await program.methods
                .takeSwap(bidToscBid(Data.bid))
                .accounts({
                    swapDataAccount: swapDataAccount,
                    swapDataAccountTokenAta,

                    maker,
                    makerNftAta,
                    makerTokenAta,

                    taker,
                    takerNftAta,
                    takerTokenAta,

                    nftMintTaker,
                    mintToken,

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

        let takeSwapTx = undefined;
        if (takeIxs.length > 1) {
            takeSwapTx = new Transaction().add(...takeIxs);
            takeSwapTx = await addPriorityFee(takeSwapTx, prioritizationFee);
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
            mintToken,
            taker,
            signer: taker,
            nftMintTaker,
        });
        if (creatorIxs) payRIxs.push(...creatorIxs);

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: mintToken,
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
                    swapDataAccount: swapDataAccount,
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
                    mintToken,

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

        let payRoyaltiesTx = undefined;
        if (payRIxs.length > 1) {
            payRoyaltiesTx = new Transaction().add(...payRIxs);
            payRoyaltiesTx = await addPriorityFee(payRoyaltiesTx, prioritizationFee);
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
                swapDataAccount: swapDataAccount,
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
                mintToken,

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

        let claimSwapTx = new Transaction().add(...claimSIxs);
        if (swapDataData.mintToken === WRAPPED_SOL_MINT.toString())
            claimSwapTx.add(closeWSol(Data.taker, taker, takerTokenAta));

        claimSwapTx = await addPriorityFee(claimSwapTx, prioritizationFee);
        claimSwapTx.recentBlockhash = blockhash;
        claimSwapTx.feePayer = new PublicKey(Data.taker);

        let bTTakeAndClose: BundleTransaction[] = [];
        let priority = 0;

        if (takeSwapTx) {
            takeSwapTx.recentBlockhash = blockhash;
            takeSwapTx.feePayer = new PublicKey(Data.taker);
            bTTakeAndClose.push({
                tx: new VersionedTransaction(takeSwapTx.compileMessage()),
                description: DESC.takeSwap,
                details: {
                    bid: bid,
                    nftMintTaker,
                    swapDataAccount: swapDataAccount,
                    taker,
                    prioritizationFee: prioritizationFee,
                },
                priority,
                status: "pending",
                blockheight,
            } as BTv);

            priority++;
        } else console.log("no takeSwapTx");

        if (payRoyaltiesTx) {
            payRoyaltiesTx.recentBlockhash = blockhash;
            payRoyaltiesTx.feePayer = new PublicKey(Data.taker);
            bTTakeAndClose.push({
                tx: new VersionedTransaction(payRoyaltiesTx.compileMessage()),
                description: DESC.payRoyalties,
                details: {
                    swapDataAccount: swapDataAccount,
                    signer: taker,
                    prioritizationFee: prioritizationFee,
                },
                priority,
                status: "pending",
                blockheight,
            } as BTv);

            priority++;
        } else console.log("no payRoyaltiesTx");

        bTTakeAndClose.push({
            tx: new VersionedTransaction(claimSwapTx.compileMessage()),
            description: DESC.claimSwap,
            details: {
                swapDataAccount: swapDataAccount,
                signer: taker,
                prioritizationFee: prioritizationFee,
            },
            priority,
            status: "pending",
            blockheight,
        } as BTv);

        return bTTakeAndClose;
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
