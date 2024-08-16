import { getSdaData } from "../utils/getSdaData.function";
import {
    Cluster,
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
    NS_FEE,
    // SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
    METAPLEX_AUTH_RULES_PROGRAM,
    TOKEN_METADATA_PROGRAM,
    VERSION,
} from "../utils/const";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findPnftAccounts,
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
import { takerFee } from "../utils/fees";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { getCompNFTData } from "../utils/compressedHelper";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { SPL_ASSOCIATED_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import BN from "bn.js";
import { parseTakeAndCloseTxs } from "./takeSwapUtils";
import { option } from "@metaplex-foundation/umi/serializers";
import { none, some } from "@metaplex-foundation/umi";

export async function createTakeAndCloseSwapInstructions(
    Data: TakeSArg & EnvOpts // & { index: number }
): Promise<BundleTransaction[]> {
    console.log(VERSION);
    let cEnvOpts = await checkEnvOpts(Data);
    let takeArgs = getTakeArgs(Data);
    let { program, connection } = cEnvOpts;
    let { taker, swapDataAccount, bid, nftMintTaker, verifyTaker, signer, n, unwrap } = takeArgs;
    if (!n) n = 0;

    if (!signer) {
        console.log("no signer", taker);
        signer = taker;
    } else console.log("signer", signer, "taker", taker);

    let takeIxs: TransactionInstruction[] = [];
    let claimIxs: TransactionInstruction[] = [];
    let payRMakerIxs: TransactionInstruction[] = [];
    let payRTakerIxs: TransactionInstruction[] = [];
    let closeSIxs: TransactionInstruction[] = [];
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
        if (takerTokenIx) {
            takeIxs.push(takerTokenIx);
            claimIxs.push(takerTokenIx);
        } else console.log("takerTokenAta", takerTokenAta);

        let { mintAta: swapDataAccountTokenAta, instruction: sdaTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer,
        });
        // if (sdaTokenIx) takeAndClaimIxs.push(sdaTokenIx);
        // else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

        let { mintAta: makerTokenAta, instruction: makerTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer,
        });
        if (makerTokenIx) {
            takeIxs.push(makerTokenIx);
            claimIxs.push(makerTokenIx);
        } else console.log("makerTokenAta", makerTokenAta);

        let { mintAta: nsFeeTokenAta, instruction: nsTokenIx } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer,
        });
        if (nsTokenIx) claimIxs.push(nsTokenIx);
        else console.log("nsFeeTokenAta", nsFeeTokenAta);

        //
        // Getting metadata Maker Nft
        //

        let nftMetadataMaker: string | null = null;
        let tokenStandardMaker: number | null = null;

        if (makerNftStd === "native") {
            console.log("makerNftStd", makerNftStd);

            const { metadataAddress: nftMetadataMaker2, tokenStandard: tokenStandardMaker2 } =
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintMaker,
                });
            nftMetadataMaker = nftMetadataMaker2;
            tokenStandardMaker = tokenStandardMaker2 ? tokenStandardMaker2 : null;
            // console.log("nftMetadataMaker", nftMetadataMaker);
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
            // console.log("nftMetadataTaker", nftMetadataTaker);
        }

        //
        // taking Swap
        //

        let takerAmount = takerFee({ bid, n });
        if (!acceptedBid) {
            if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString()) {
                if (takerAmount > 0) takeIxs.push(...addWSol(taker, takerTokenAta, takerAmount));
            }
            if (takerNftStd == "core") {
                let takerCoreCollection = await getCoreCollection({
                    connection,
                    mint: nftMintTaker,
                });
                const takeIx = await program.methods
                    .takeSwapCore(bidToscBid(bid), n)
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,

                        maker,
                        makerTokenAta,

                        taker,
                        takerTokenAta,

                        nftMintTaker,
                        // paymentMint,

                        collection: takerCoreCollection,

                        coreProgram: MPL_CORE_PROGRAM_ID,
                        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                takeIxs.push(takeIx);
            } else if (takerNftStd === "compressed") {
                let cluster = (
                    !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
                ) as Cluster;
                let {
                    creatorHash,
                    dataHash,
                    index,
                    merkleTree,
                    nonce,
                    proofMeta,
                    root,
                    treeAuthority,
                    collection,
                    metadata,
                } = await getCompNFTData({ cluster, tokenId: nftMintTaker, connection });
                if (!metadata) throw "Compressed no metadata found";
                if (metadata.collection == null) throw "Compressed no collection found";

                let takeIx = await program.methods
                    .takeSwapComp(
                        // bidToscBid(bid),
                        // bidToscBid(bid).collection,
                        metadata.collection,
                        new BN(takerAmount),
                        Array.from(root),
                        // Array.from(dataHash),
                        // Array.from(creatorHash),
                        metadata.name,
                        metadata.symbol,
                        metadata.uri,
                        metadata.sellerFeeBasisPoints,
                        metadata.primarySaleHappened,
                        metadata.isMutable,
                        metadata.editionNonce,
                        metadata.creators,
                        // (metadata.creators.map((c) => c.address)),
                        // (metadata.creators.map((c) => c.verified)),
                        // Buffer.from(metadata.creators.map((c) => c.share)),
                        nonce,
                        index,
                        n
                    )
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        maker,
                        makerTokenAta,
                        // tokenId: nftMintMaker,
                        merkleTree,
                        // paymentMint,
                        treeAuthority,
                        // collection,
                        // nftMintTaker,
                        taker,
                        takerTokenAta,
                        // ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                        bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
                        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                        logWrapper: SPL_NOOP_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    })
                    .remainingAccounts(proofMeta)
                    .instruction();
                takeIxs.push(takeIx);
            } else {
                let { mintAta: makerNftAta, instruction: makerAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintTaker,
                        owner: maker,
                        signer,
                    });
                if (makerAtaMakerNftIx) takeIxs.push(makerAtaMakerNftIx);
                else console.log("makerNftAta", makerNftAta);

                let { mintAta: takerNftAta, instruction: takerAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintTaker,
                        owner: taker,
                        signer,
                    });
                if (takerAtaMakerNftIx) takeIxs.push(takerAtaMakerNftIx);
                else console.log("takerNftAta", takerNftAta);

                if (takerNftStd === "native") {
                    let nftMasterEditionTaker: string | null = null;
                    let ownerTokenRecordTaker: string | null = null;
                    let destinationTokenRecordTaker: string | null = null;
                    let authRulesTaker: string | null = null;

                    if (tokenStandardTaker == TokenStandard.ProgrammableNonFungible) {
                        ({
                            authRules: authRulesTaker,
                            destinationTokenRecord: destinationTokenRecordTaker,
                            masterEdition: nftMasterEditionTaker,
                            ownerTokenRecord: ownerTokenRecordTaker,
                        } = await findPnftAccounts({
                            connection,
                            destinationAta: makerNftAta,
                            mint: nftMintTaker,
                            ownerAta: takerNftAta,
                        }));
                    }

                    if (!nftMetadataTaker)
                        nftMetadataTaker = (
                            await findNftDataAndMetadataAccount({
                                connection,
                                mint: nftMintTaker,
                            })
                        ).metadataAddress;

                    let isTrait = true;
                    let traitIndex = 0;

                    const takeIx = await program.methods
                        .takeSwap(bidToscBid(bid), n, isTrait, traitIndex)
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
                            // paymentMint,

                            nftMetadataTaker,
                            nftMasterEditionTaker,
                            ownerTokenRecordTaker,
                            destinationTokenRecordTaker,
                            authRulesTaker,

                            systemProgram: SystemProgram.programId.toString(),
                            metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
                            tokenProgram: TOKEN_PROGRAM_ID.toString(),
                            ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
                            authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM.toString(),
                        })
                        .remainingAccounts([
                            { isSigner: false, isWritable: false, pubkey: program.programId },
                        ])
                        .instruction();
                    takeIxs.push(takeIx);
                } else {
                    let makerhashlistMarker = await getHashlistMarker({
                        collection: Data.bid.collection,
                        nftMintTaker,
                    });
                    console.log("makerhashlistMarker", makerhashlistMarker);

                    const takeIx = await program.methods
                        .takeSwap22(bidToscBid(Data.bid), n)
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
                            // paymentMint,

                            hashlistMarker: makerhashlistMarker,

                            systemProgram: SystemProgram.programId,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            tokenProgram22: TOKEN_2022_PROGRAM_ID,
                            ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                        })
                        .instruction();
                    takeIxs.push(takeIx);
                }
            }
        }

        if (!claimed) {
            if (makerNftStd === "core") {
                let coreCollection = await getCoreCollection({ mint: nftMintMaker, connection });
                const claimCoreIx = await program.methods
                    .claimSwapCore()
                    .accountsStrict({
                        ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                        nsFee: NS_FEE,
                        nsFeeTokenAta,
                        signer,
                        taker,
                        takerTokenAta,
                        collection: coreCollection,
                        maker,
                        makerTokenAta,
                        nftMintMaker,
                        // paymentMint,
                        swapDataAccountTokenAta,
                        tokenProgram: TOKEN_PROGRAM_ID.toString(),
                        coreProgram: MPL_CORE_PROGRAM_ID.toString(),
                        swapDataAccount,
                        systemProgram: SystemProgram.programId.toString(),
                    })
                    .instruction();
                claimIxs.push(claimCoreIx);
            } else if (makerNftStd === "compressed") {
                let cluster = (
                    cEnvOpts.clusterOrUrl.includes("devnet") ? "devnet" : "mainnet-beta"
                ) as Cluster;
                let {
                    creatorHash,
                    dataHash,
                    index,
                    merkleTree,
                    nonce,
                    proofMeta,
                    root,
                    treeAuthority,
                    collection,
                    metadata,
                } = await getCompNFTData({ cluster, tokenId: nftMintMaker, connection });
                // console.log("was claim makerNFT");

                if (!metadata) throw "Compressed no metadata found";
                if (metadata.collection == null) throw "Compressed no collection found";

                let claimCompIx = await program.methods
                    .claimSwapComp(
                        Array.from(creatorHash),
                        Array.from(dataHash),
                        Array.from(root),
                        nonce,
                        index
                    )
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        signer,

                        maker,
                        makerTokenAta,
                        // tokenId: nftMintMaker,
                        merkleTree,
                        // paymentMint,
                        treeAuthority,
                        // collection,
                        // nftMintTaker,
                        taker,
                        takerTokenAta,

                        nsFee: NS_FEE,
                        nsFeeTokenAta,

                        ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                        bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
                        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                        logWrapper: SPL_NOOP_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        // sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    })
                    .remainingAccounts(proofMeta)
                    .instruction();
                claimIxs.push(claimCompIx);
            } else {
                // if (sdaAtaMakerNftIx) claimIxs.push(sdaAtaMakerNftIx);
                // else console.log("swapDataAccountNftAta", swapDataAccountNftAta);
                let { mintAta: swapDataAccountNftAta, instruction: sdaAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintMaker,
                        owner: swapDataAccount,
                        signer,
                    });

                let { mintAta: takerNftAtaMaker, instruction: takerAtaMakerNftIx } =
                    await findOrCreateAta({
                        connection,
                        mint: nftMintMaker,
                        owner: taker,
                        signer,
                    });
                if (takerAtaMakerNftIx) claimIxs.push(takerAtaMakerNftIx);
                else console.log("takerNftAta", takerNftAtaMaker);

                if (makerNftStd === "native") {
                    let nftMasterEditionMaker: string | null = null;
                    let ownerTokenRecordMaker: string | null = null;
                    let destinationTokenRecordMaker: string | null = null;
                    let authRulesMaker: string | null = null;

                    if (tokenStandardMaker == TokenStandard.ProgrammableNonFungible) {
                        ({
                            authRules: authRulesMaker,
                            destinationTokenRecord: destinationTokenRecordMaker,
                            masterEdition: nftMasterEditionMaker,
                            ownerTokenRecord: ownerTokenRecordMaker,
                        } = await findPnftAccounts({
                            connection,
                            destinationAta: takerNftAtaMaker,
                            mint: nftMintMaker,
                            ownerAta: swapDataAccountNftAta,
                        }));
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
                            // paymentMint,

                            nftMetadataMaker,
                            nftMasterEditionMaker,
                            ownerTokenRecordMaker,
                            destinationTokenRecordMaker,
                            authRulesMaker,

                            systemProgram: SystemProgram.programId,
                            metadataProgram: TOKEN_METADATA_PROGRAM,
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                            authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                        })
                        .instruction();

                    claimIxs.push(claimIx);
                } else {
                    // console.log("signer", signer);
                    // console.log("taker", taker);

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
                            // paymentMint,

                            systemProgram: SystemProgram.programId,
                            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            tokenProgram22: TOKEN_2022_PROGRAM_ID,
                            ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                        })
                        .instruction();

                    claimIxs.push(claimIx);
                }
            }
        }

        //
        // Paying royalties Taker
        //

        if (!royaltiesPaidTaker) {
            console.log("royaltiesPaidTaker", makerNftStd);
            if (makerNftStd === "core") {
                let {
                    creators: makerCreators,
                    creatorTokenAta: makerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintMaker,
                    owner: swapDataAccount,
                    paymentMint,
                    signer,
                    tokenStandard: makerNftStd,
                });
                let payTakerCoreIx = await program.methods
                    .payRoyaltiesCore()
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        nftMint: nftMintMaker,
                        // paymentMint,
                        signer,
                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,
                        creator0: makerCreators[0],
                        creator0TokenAta: makerCreatorTokenAta[0],
                        creator1: makerCreators[1],
                        creator1TokenAta: makerCreatorTokenAta[1],
                        creator2: makerCreators[2],
                        creator2TokenAta: makerCreatorTokenAta[2],
                        creator3: makerCreators[3],
                        creator3TokenAta: makerCreatorTokenAta[3],
                        creator4: makerCreators[4],
                        creator4TokenAta: makerCreatorTokenAta[4],
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                payRTakerIxs.push(...creatorIxs);
                payRTakerIxs.push(payTakerCoreIx);
            } else if (makerNftStd === "compressed") {
                let {
                    creators: makerCreators,
                    creatorTokenAta: makerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintMaker,
                    owner: taker,
                    paymentMint,
                    signer,
                    tokenStandard: makerNftStd,
                });
                // console.log("was pay royalties taker", makerCreators, makerCreatorTokenAta);

                let cluster = (
                    !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
                ) as Cluster;
                let { index, merkleTree, nonce, proofMeta, root, metadata, owner } =
                    await getCompNFTData({
                        cluster,
                        tokenId: nftMintMaker,
                        connection,
                        getRootHash: "calculate",
                        newOwner: taker,
                    });
                if (!metadata) throw "Compressed no metadata found";
                if (metadata.collection == null) throw "Compressed no collection found";

                let payTakerCoreIx = await program.methods
                    .payRoyaltiesComp(
                        root,
                        metadata.name,
                        metadata.symbol,
                        metadata.uri,
                        metadata.sellerFeeBasisPoints,
                        metadata.primarySaleHappened,
                        metadata.isMutable,
                        metadata.editionNonce,
                        metadata.creators,
                        metadata.collection,
                        nonce,
                        index
                    )
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        // nftMint: nftMintMaker,

                        // paymentMint,
                        merkleTree,
                        owner,
                        signer,
                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,
                        creator0: makerCreators[0],
                        creator0TokenAta: makerCreatorTokenAta[0],
                        creator1: makerCreators[1],
                        creator1TokenAta: makerCreatorTokenAta[1],
                        creator2: makerCreators[2],
                        creator2TokenAta: makerCreatorTokenAta[2],
                        creator3: makerCreators[3],
                        creator3TokenAta: makerCreatorTokenAta[3],
                        creator4: makerCreators[4],
                        creator4TokenAta: makerCreatorTokenAta[4],
                        tokenProgram: TOKEN_PROGRAM_ID,
                        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                    })
                    .remainingAccounts(proofMeta)
                    .instruction();
                payRTakerIxs.push(...creatorIxs);
                payRTakerIxs.push(payTakerCoreIx);
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
                    tokenStandard: makerNftStd,
                });

                if (creatorIxs.length > 0) {
                    console.log("creatorIxs added", creatorIxs.length);
                    payRTakerIxs.push(...creatorIxs);
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

                        // paymentMint,

                        signer,

                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,

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
                payRTakerIxs.push(payRIx);
                // console.log("payRIx", payRIx);
            } else {
                const payRIx = await program.methods
                    .payRoyalties22()
                    .accountsStrict({
                        swapDataAccount,
                        // swapDataAccountTokenAta,
                        nftMint: nftMintMaker,

                        signer,

                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                        // tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                payRTakerIxs.push(payRIx);
            }
        }

        //
        // Paying royalties maker
        //

        if (!royaltiesPaidMaker) {
            console.log("royaltiesPaidMaker", takerNftStd);

            if (takerNftStd === "core") {
                let {
                    creators: makerCreators,
                    creatorTokenAta: makerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintTaker,
                    owner: swapDataAccount,
                    paymentMint,
                    signer,
                    tokenStandard: takerNftStd,
                });
                let payTakerCoreIx = await program.methods
                    .payRoyaltiesCore()
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        nftMint: nftMintTaker,
                        // paymentMint,
                        signer,
                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,
                        creator0: makerCreators[0],
                        creator0TokenAta: makerCreatorTokenAta[0],
                        creator1: makerCreators[1],
                        creator1TokenAta: makerCreatorTokenAta[1],
                        creator2: makerCreators[2],
                        creator2TokenAta: makerCreatorTokenAta[2],
                        creator3: makerCreators[3],
                        creator3TokenAta: makerCreatorTokenAta[3],
                        creator4: makerCreators[4],
                        creator4TokenAta: makerCreatorTokenAta[4],
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                payRMakerIxs.push(...creatorIxs);
                payRMakerIxs.push(payTakerCoreIx);
            } else if (takerNftStd === "compressed") {
                let {
                    creators: makerCreators,
                    creatorTokenAta: makerCreatorTokenAta,
                    instructions: creatorIxs,
                } = await getCreatorData({
                    connection,
                    nftMint: nftMintTaker,
                    owner: maker,
                    paymentMint,
                    signer,
                    tokenStandard: takerNftStd,
                });

                let cluster = (
                    !cEnvOpts.clusterOrUrl.includes("mainnet") ? "devnet" : "mainnet-beta"
                ) as Cluster;
                let { index, merkleTree, nonce, proofMeta, root, metadata, owner } =
                    await getCompNFTData({
                        cluster,
                        tokenId: nftMintTaker,
                        connection,
                        getRootHash: "calculate",
                        newOwner: maker,
                    });
                if (!metadata) throw "Compressed no metadata found";
                if (metadata.collection == null) throw "Compressed no collection found";

                let payTakerCoreIx = await program.methods
                    .payRoyaltiesComp(
                        root,
                        metadata.name,
                        metadata.symbol,
                        metadata.uri,
                        metadata.sellerFeeBasisPoints,
                        metadata.primarySaleHappened,
                        metadata.isMutable,
                        metadata.editionNonce,
                        metadata.creators,
                        metadata.collection,
                        nonce,
                        index
                    )
                    .accountsStrict({
                        swapDataAccount,
                        swapDataAccountTokenAta,
                        // nftMint: nftMintMaker,

                        // paymentMint,
                        merkleTree,
                        owner,
                        signer,
                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,
                        creator0: makerCreators[0],
                        creator0TokenAta: makerCreatorTokenAta[0],
                        creator1: makerCreators[1],
                        creator1TokenAta: makerCreatorTokenAta[1],
                        creator2: makerCreators[2],
                        creator2TokenAta: makerCreatorTokenAta[2],
                        creator3: makerCreators[3],
                        creator3TokenAta: makerCreatorTokenAta[3],
                        creator4: makerCreators[4],
                        creator4TokenAta: makerCreatorTokenAta[4],
                        tokenProgram: TOKEN_PROGRAM_ID,
                        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                    })
                    .remainingAccounts(proofMeta)
                    .instruction();
                payRMakerIxs.push(...creatorIxs);
                payRMakerIxs.push(payTakerCoreIx);
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
                    tokenStandard: takerNftStd,
                });

                if (creatorIxs) payRMakerIxs.push(...creatorIxs);

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

                        // paymentMint,

                        signer,

                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,

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
                payRMakerIxs.push(payRIx);
            } else {
                // console.log("payMakerRoyalties22 signer,", signer);

                const payRIx = await program.methods
                    .payRoyalties22()
                    .accountsStrict({
                        swapDataAccount,
                        // swapDataAccountTokenAta,
                        nftMint: nftMintTaker,
                        signer,
                        // nsFee: NS_FEE,
                        // nsFeeTokenAta,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                        // tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction();
                payRMakerIxs.push(payRIx);
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
                // swapDataAccountNftAta,

                maker,
                makerTokenAta,
                // paymentMint,
                signer,

                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        closeSIxs.push(closeIx);

        if (
            swapDataData.paymentMint === WRAPPED_SOL_MINT.toString() &&
            (unwrap === undefined || unwrap === true)
        ) {
            if (signer === taker) claimIxs.push(closeWSol(taker, taker, takerTokenAta));
            else if (signer === maker) closeSIxs.push(closeWSol(maker, maker, makerTokenAta));
        }
        let bTTakeAndClose = parseTakeAndCloseTxs({
            cEnvOpts,
            claimIxs,
            closeSIxs,
            connection,
            makerNftStd,
            payRMakerIxs,
            payRTakerIxs,
            signer,
            takeArgs,
            takeIxs,
            takerNftStd,
            acceptedBid,
            claimed,
            royaltiesPaidMaker,
            royaltiesPaidTaker,
        });
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
