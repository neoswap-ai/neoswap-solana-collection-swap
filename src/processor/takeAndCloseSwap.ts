import {
    Cluster,
    ComputeBudgetProgram,
    Keypair,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { Bid, ErrorFeedback, TxWithSigner } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { sendSingleTransaction } from "../utils/sendSingleTransaction.function";
import { createTakeSwapInstructions } from "../programInstructions/takeSwap.instructions";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../utils/const";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { getSdaData } from "../utils/getSdaData.function";
import { getCreatorData } from "../utils/creators";

export async function takeAndCloseSwap(Data: {
    swapDataAccount: PublicKey;
    taker: Keypair;
    nftMintTaker: PublicKey;
    bid: Bid;
    clusterOrUrl: Cluster | string;
    skipSimulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.taker });

    let connection = program.provider.connection;
    let dummyBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let takeIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 250000,
        }),
    ];

    let swapDataData = await getSdaData({
        program: program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });
    if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount.toBase58();
    const {
        paymentMint,
        maker,
        nftMintMaker,
        bids,
        // endTime,
        // royaltiesPaid,
        // seed,
        // acceptedBid,
    } = swapDataData;
    console.log("bids", bids);

    const foundBid = bids.find(
        (b) =>
            b.amount.eq(Data.bid.amount) &&
            b.collection.equals(Data.bid.collection) &&
            b.takerNeoswapFee.eq(Data.bid.takerNeoswapFee) &&
            b.takerRoyalties.eq(Data.bid.takerRoyalties) &&
            b.makerRoyalties.eq(Data.bid.makerRoyalties) &&
            b.makerNeoswapFee.eq(Data.bid.makerNeoswapFee)
    );
    if (!foundBid) throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(bids)} `;

    let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
        connection,
        mint: Data.nftMintTaker,
        owner: Data.taker.publicKey,
        signer: Data.taker.publicKey,
    });
    if (tn) {
        takeIxs.push(tn);
        console.log("takerNftAta", takerNftAta.toBase58());
    }

    let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: Data.taker.publicKey,
        signer: Data.taker.publicKey,
    });
    if (tt) {
        takeIxs.push(tt);
        console.log("takerTokenAta", takerTokenAta.toBase58());
    }

    let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
        connection,
        mint: Data.nftMintTaker,
        owner: maker,
        signer: Data.taker.publicKey,
    });
    if (mn) {
        takeIxs.push(mn);
        console.log("makerNftAta", makerNftAta.toBase58());
    }

    let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: maker,
        signer: Data.taker.publicKey,
    });
    if (mt) {
        takeIxs.push(mt);
        console.log("makerTokenAta", makerTokenAta.toBase58());
    }
    let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: Data.swapDataAccount,
        signer: Data.taker.publicKey,
    });
    if (sdat) {
        takeIxs.push(sdat);
        console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
    }

    const { metadataAddress: nftMetadataTaker, tokenStandard: tokenStandardTaker } =
        await findNftDataAndMetadataAccount({
            connection: program.provider.connection,
            mint: Data.nftMintTaker,
        });
    console.log("nftMetadataTaker", nftMetadataTaker.toBase58());

    let nftMasterEditionTaker = Data.taker.publicKey;
    let ownerTokenRecordTaker = Data.taker.publicKey;
    let destinationTokenRecordTaker = Data.taker.publicKey;
    let authRulesTaker = Data.taker.publicKey;

    if (tokenStandardTaker == TokenStandard.ProgrammableNonFungible) {
        const nftMasterEditionF = findNftMasterEdition({
            mint: Data.nftMintTaker,
        });
        console.log("nftMasterEditionF", nftMasterEditionF.toBase58());

        const ownerTokenRecordF = findUserTokenRecord({
            mint: Data.nftMintTaker,
            userMintAta: takerNftAta,
        });
        console.log("ownerTokenRecordF", ownerTokenRecordF.toBase58());

        const destinationTokenRecordF = findUserTokenRecord({
            mint: Data.nftMintTaker,
            userMintAta: makerNftAta,
        });
        console.log("destinationTokenRecordF", destinationTokenRecordF.toBase58());

        const authRulesF = await findRuleSet({
            connection,
            mint: Data.nftMintTaker,
        });
        console.log("authRulesF", authRulesF.toBase58());

        nftMasterEditionTaker = nftMasterEditionF;
        ownerTokenRecordTaker = ownerTokenRecordF;
        destinationTokenRecordTaker = destinationTokenRecordF;
        authRulesTaker = authRulesF;
    }
    console.log("bid", Data.bid);

    const takeIx = await program.methods
        .takeSwap(Data.bid)
        .accounts({
            swapDataAccount: Data.swapDataAccount,
            swapDataAccountTokenAta,

            maker,
            makerNftAta,
            makerTokenAta,

            taker: Data.taker.publicKey,
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

    const takeSwapTx = new Transaction().add(...takeIxs);
    takeSwapTx.feePayer = Data.taker.publicKey;
    takeSwapTx.recentBlockhash = dummyBlockhash;

    let payRIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 300000,
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
        taker: Data.taker.publicKey,
        nftMintTaker: Data.nftMintTaker,
    });

    if (creatorIxs) payRIxs.push(...creatorIxs);

    let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
        connection,
        mint: paymentMint,
        owner: NS_FEE,
        signer: Data.taker.publicKey,
    });
    if (nst) {
        payRIxs.push(nst);
        console.log("nsFeeTokenAta", nsFeeTokenAta.toBase58());
    }

    const { metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
        await findNftDataAndMetadataAccount({
            connection: program.provider.connection,
            mint: nftMintMaker,
        });

    console.log("nftMetadataMaker", nftMetadataMaker.toBase58());

    const payRIx = await program.methods
        .payRoyalties()
        .accounts({
            swapDataAccount: Data.swapDataAccount,
            swapDataAccountTokenAta,

            maker,
            // makerNftAta,
            makerTokenAta,

            taker: Data.taker.publicKey,
            takerNftAta,
            takerTokenAta,

            nsFee: NS_FEE,
            nsFeeTokenAta,

            nftMintTaker: Data.nftMintTaker,
            mintToken: paymentMint,

            nftMetadataTaker,
            nftMetadataMaker,

            systemProgram: SystemProgram.programId,
            metadataProgram: TOKEN_METADATA_PROGRAM,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
            authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,

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

    let payRoyaltiesTx = new Transaction().add(...payRIxs);

    ///////////////////////////////////

    let claimSIxs: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 250000,
        }),
    ];

    let { mintAta: swapDataAccountNftAta, instruction: sdan } = await findOrCreateAta({
        connection,
        mint: nftMintMaker,
        owner: Data.swapDataAccount,
        signer: Data.taker.publicKey,
    });

    if (sdan) {
        claimSIxs.push(sdan);
        console.log("swapDataAccountNftAta", swapDataAccountNftAta.toBase58());
    }

    let { mintAta: takerNftAtaMaker, instruction: tmn } = await findOrCreateAta({
        connection,
        mint: nftMintMaker,
        owner: Data.taker.publicKey,
        signer: Data.taker.publicKey,
    });
    if (tmn) {
        claimSIxs.push(tmn);
        console.log("takerNftAta", takerNftAtaMaker.toBase58());
    }

    let nftMasterEditionMaker = Data.taker.publicKey;
    let ownerTokenRecordMaker = Data.taker.publicKey;
    let destinationTokenRecordMaker = Data.taker.publicKey;
    let authRulesMaker = Data.taker.publicKey;

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
            userMintAta: takerNftAta,
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
            swapDataAccount: Data.swapDataAccount,
            swapDataAccountNftAta,
            swapDataAccountTokenAta,

            nsFee: NS_FEE,
            nsFeeTokenAta,

            taker: Data.taker.publicKey,
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

    let claimSwapTx = new Transaction().add(...claimSIxs);

    let txsWithoutSigners: TxWithSigner[] = [
        { tx: takeSwapTx },
        { tx: payRoyaltiesTx },
        { tx: claimSwapTx },
    ];
    try {
        return await sendBundledTransactions({
            provider: program.provider as AnchorProvider,
            txsWithoutSigners,
            signer: Data.taker,
            clusterOrUrl: Data.clusterOrUrl,
            skipSimulation: Data.skipSimulation,
            skipConfirmation: Data.skipConfirmation,
        });
    } catch (error) {
        throw {
            blockchain: "solana",
            message: Data.swapDataAccount.toString() + `- -\n` + error,
            status: "error",
        } as ErrorFeedback;
    }
}
