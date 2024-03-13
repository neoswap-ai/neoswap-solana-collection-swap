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
    Bid,
    BundleTransaction,
    EnvOpts,
    ErrorFeedback,
    TakeSArg,
    TxWithSigner,
} from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import {
    TOKEN_PROGRAM_ID,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
} from "@solana/spl-token";
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

export async function createTakeAndCloseSwapInstructions(
    Data: TakeSArg & EnvOpts
): Promise<BundleTransaction[]> {
    console.log(VERSION);
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

    let takeIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 8500000,
        }),
    ];
    try {
        let swapDataData = await getSdaData({
            program: Data.program,
            swapDataAccount: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount;

        const { paymentMint, maker, nftMintMaker, bids, taker, acceptedBid, royaltiesPaid } =
            swapDataData;

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
            takeIxs.push(tn);
            console.log("takerNftAta", takerNftAta);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tt) {
            takeIxs.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintTaker,
            owner: maker,
            signer: Data.taker,
        });
        if (mn) {
            takeIxs.push(mn);
            console.log("makerNftAta", makerNftAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: Data.taker,
        });
        if (mt) {
            takeIxs.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.swapDataAccount,
            signer: Data.taker,
        });
        if (sdat) {
            takeIxs.push(sdat);
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
        console.log("bid", Data.bid);

        if (!acceptedBid) {
            if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
                let amount = Data.bid.takerNeoswapFee + Data.bid.takerRoyalties;
                if (Data.bid.amount > 0) amount += Data.bid.amount;
                console.log("Wrapping " + amount + " lamports to wSOL");

                takeIxs.push(
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
            takeIxs.push(takeIx);
        }

        let takeSwapTx = undefined;
        if (takeIxs.length > 2) {
            takeSwapTx = new Transaction().add(...takeIxs);
            takeSwapTx = await addPriorityFee(takeSwapTx);
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
            taker: Data.taker,
            signer: Data.taker,
            nftMintTaker: Data.nftMintTaker,
        });
        if (creatorIxs) payRIxs.push(...creatorIxs);

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer: Data.taker,
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
            const payRIx = await Data.program.methods
                .payRoyalties()
                .accounts({
                    swapDataAccount: Data.swapDataAccount,
                    swapDataAccountTokenAta,

                    // maker,
                    // makerNftAta,
                    // makerTokenAta,
                    signer: Data.taker,

                    // taker: Data.taker,
                    // takerNftAta,
                    // takerTokenAta,

                    // nsFee: NS_FEE,
                    // nsFeeTokenAta,

                    // nftMintTaker: Data.nftMintTaker,
                    mintToken: paymentMint,

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
        if (payRIxs.length > 2) {
            payRoyaltiesTx = new Transaction().add(...payRIxs);
            payRoyaltiesTx = await addPriorityFee(payRoyaltiesTx);
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
            owner: Data.swapDataAccount,
            signer: Data.taker,
        });

        if (sdan) {
            claimSIxs.push(sdan);
            console.log("swapDataAccountNftAta", swapDataAccountNftAta);
        }

        let { mintAta: takerNftAtaMaker, instruction: tmn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tmn) {
            claimSIxs.push(tmn);
            console.log("takerNftAta", takerNftAtaMaker);
        }

        let nftMasterEditionMaker = Data.taker;
        let ownerTokenRecordMaker = Data.taker;
        let destinationTokenRecordMaker = Data.taker;
        let authRulesMaker = Data.taker;

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

        const initIx = await Data.program.methods
            .claimSwap()
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                nsFee: NS_FEE,
                nsFeeTokenAta,

                signer: taker,
                taker: Data.taker,
                takerNftAtaMaker,
                takerTokenAta,

                maker,
                // makerNftAta,
                makerTokenAta,

                nftMintMaker,
                mintToken: paymentMint,

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

        let claimSwapTx = new Transaction()
            .add(...claimSIxs)
            .add(
                createCloseAccountInstruction(
                    new PublicKey(takerTokenAta),
                    new PublicKey(Data.taker),
                    new PublicKey(Data.taker)
                )
            );

        claimSwapTx = await addPriorityFee(claimSwapTx);
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
                    bid: Data.bid,
                    nftMintTaker: Data.nftMintTaker,
                    swapDataAccount: Data.swapDataAccount,
                    taker: Data.taker,
                },
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no takeSwapTx");

        if (payRoyaltiesTx) {
            payRoyaltiesTx.recentBlockhash = blockhash;
            payRoyaltiesTx.feePayer = new PublicKey(Data.taker);
            bTTakeAndClose.push({
                tx: new VersionedTransaction(payRoyaltiesTx.compileMessage()),
                description: DESC.payRoyalties,
                details: {
                    swapDataAccount: Data.swapDataAccount,
                },
                priority,
                status: "pending",
                blockheight,
            });

            priority++;
        } else console.log("no payRoyaltiesTx");

        bTTakeAndClose.push({
            tx: new VersionedTransaction(claimSwapTx.compileMessage()),
            description: DESC.claimSwap,
            details: {
                swapDataAccount: Data.swapDataAccount,
            },
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
            swapDataAccount: Data.swapDataAccount,
        };
    }
}
