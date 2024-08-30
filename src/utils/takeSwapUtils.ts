import { BN, Program } from "@coral-xyz/anchor";
import { AssetStandard, Bid, BTv, CEnvOpts, TakeSArg } from "./types";
import { bidToscBid } from "./typeSwap";
import { CollectionSwap } from "./neoSwap.idl";
import {
    findNftDataAndMetadataAccount,
    findPnftAccounts,
    getHashlistMarker,
} from "./findNftDataAndAccounts.function";
import {
    Cluster,
    Connection,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SPL_ASSOCIATED_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { METAPLEX_AUTH_RULES_PROGRAM, TOKEN_METADATA_PROGRAM } from "./const";
import { getCompNFTData } from "./compressedHelper";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { DESC } from "./descriptions";
import { appendToBT, ix2vTx } from "./vtx";

// export async function takeSwap22Ix({
//     bid,
//     maker,
//     makerNftAta,
//     makerTokenAta,
//     nftMintTaker,
//     swapDataAccount,
//     swapDataAccountTokenAta,
//     taker,
//     takerNftAta,
//     takerTokenAta,
//     program,
//     n,
// }: {
//     program: Program<CollectionSwap>;

//     bid: Bid;
//     swapDataAccount: string;
//     swapDataAccountTokenAta: string;

//     maker: string;
//     makerNftAta: string;
//     makerTokenAta: string;

//     taker: string;
//     takerNftAta: string;
//     takerTokenAta: string;

//     nftMintTaker: string;

//     n: number;
// }) {
//     let makerhashlistMarker = await getHashlistMarker({
//         collection: bid.collection,
//         nftMintTaker,
//     });
//     console.log("makerhashlistMarker", makerhashlistMarker);

//     return await program.methods
//         .takeSwap22(bidToscBid(bid), n, null, null, null)
//         .accountsStrict({
//             swapDataAccount,
//             swapDataAccountTokenAta,

//             maker,
//             makerNftAta,
//             makerTokenAta,

//             taker,
//             takerNftAta,
//             takerTokenAta,

//             nftMintTaker,
//             // paymentMint,

//             hashlistMarker: makerhashlistMarker,

//             systemProgram: SystemProgram.programId,
//             tokenProgram: TOKEN_PROGRAM_ID,
//             tokenProgram22: TOKEN_2022_PROGRAM_ID,
//             ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
//         })
//         .instruction();
// }

// export async function takeSwapIx({
//     connection,
//     makerNftAta,
//     nftMetadataTaker,
//     nftMintTaker,
//     program,
//     takerNftAta,
//     tokenStandardTaker,
//     maker,
//     makerTokenAta,
//     swapDataAccount,
//     swapDataAccountTokenAta,
//     taker,
//     takerTokenAta,
//     bid,
//     n,
// }: {
//     connection: Connection;
//     bid: Bid;
//     n: number;

//     tokenStandardTaker: TokenStandard;
//     nftMintTaker: string;
//     nftMetadataTaker: string;

//     swapDataAccount: string;
//     swapDataAccountTokenAta: string;

//     maker: string;
//     makerNftAta: string;
//     makerTokenAta: string;

//     taker: string;
//     takerNftAta: string;
//     takerTokenAta: string;

//     program: Program<CollectionSwap>;
// }) {
//     let nftMasterEditionTaker: string | null = null;
//     let ownerTokenRecordTaker: string | null = null;
//     let destinationTokenRecordTaker: string | null = null;
//     let authRulesTaker: string | null = null;

//     if (tokenStandardTaker == TokenStandard.ProgrammableNonFungible) {
//         ({
//             authRules: authRulesTaker,
//             destinationTokenRecord: destinationTokenRecordTaker,
//             masterEdition: nftMasterEditionTaker,
//             ownerTokenRecord: ownerTokenRecordTaker,
//         } = await findPnftAccounts({
//             connection,
//             destinationAta: makerNftAta,
//             mint: nftMintTaker,
//             ownerAta: takerNftAta,
//         }));
//     }

//     return await program.methods
//         .takeSwap(bidToscBid(bid), n, null, null, null)
//         .accountsStrict({
//             swapDataAccount,
//             swapDataAccountTokenAta,

//             maker,
//             makerNftAta,
//             makerTokenAta,

//             taker,
//             takerNftAta,
//             takerTokenAta,

//             nftMintTaker,
//             // paymentMint,

//             nftMetadataTaker,
//             nftMasterEditionTaker,
//             ownerTokenRecordTaker,
//             destinationTokenRecordTaker,
//             authRulesTaker,

//             systemProgram: SystemProgram.programId,
//             metadataProgram: TOKEN_METADATA_PROGRAM,
//             sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
//             tokenProgram: TOKEN_PROGRAM_ID,
//             ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
//             authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
//         })
//         .instruction();
// }

// export async function takeSwapCompIx({
//     cluster,
//     program,
//     tokenId,
//     takerAmount,
//     n,
//     maker,
//     makerTokenAta,
//     swapDataAccount,
//     swapDataAccountTokenAta,
//     taker,
//     takerTokenAta,
// }: {
//     cluster: Cluster;
//     tokenId: string;
//     // collection: string;
//     takerAmount: number;
//     n: number;

//     swapDataAccount: string;
//     swapDataAccountTokenAta: string;
//     maker: string;
//     makerTokenAta: string;
//     taker: string;
//     takerTokenAta: string;

//     program: Program<CollectionSwap>;
// }) {
//     let {
//         creatorHash,
//         dataHash,
//         leafHash,
//         index,
//         merkleTree,
//         nonce,
//         proofMeta,
//         root,
//         treeAuthority,
//         metadata,
//     } = await getCompNFTData({
//         cluster,
//         tokenId,
//         connection: program.provider.connection,
//         getRootHash: "onchain",
//         // newOwner,
//     });
//     if (!metadata) throw "Compressed no metadata found";
//     if (metadata.collection == null) throw "Compressed no collection found";
//     console.log("takeswap root", root, leafHash);

//     return await program.methods
//         .takeSwapComp(
//             metadata.collection,
//             new BN(takerAmount),
//             Array.from(root),
//             metadata.name,
//             metadata.symbol,
//             metadata.uri,
//             metadata.sellerFeeBasisPoints,
//             metadata.primarySaleHappened,
//             metadata.isMutable,
//             metadata.editionNonce,
//             metadata.creators,
//             nonce,
//             index,
//             n
//         )
//         .accountsStrict({
//             swapDataAccount,
//             swapDataAccountTokenAta,
//             maker,
//             makerTokenAta,
//             merkleTree,
//             treeAuthority,
//             taker,
//             takerTokenAta,
//             bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
//             compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
//             logWrapper: SPL_NOOP_PROGRAM_ID,
//             systemProgram: SystemProgram.programId,
//             tokenProgram: TOKEN_PROGRAM_ID,
//         })
//         .remainingAccounts(proofMeta)
//         .instruction();
// }

export async function parseTakeAndCloseTxs({
    cEnvOpts,
    claimIxs,
    closeSIxs,
    payRMakerIxs,
    payRTakerIxs,
    signer,
    takeIxs,
    acceptedBid,
    claimed,
    royaltiesPaidMaker,
    royaltiesPaidTaker,
    takeArgs,
    connection,
    makerNftStd,
    takerNftStd,
}: {
    acceptedBid?: Bid;
    claimed?: boolean;
    royaltiesPaidMaker?: boolean;
    royaltiesPaidTaker?: boolean;
    makerNftStd: AssetStandard;
    takerNftStd: AssetStandard;
    takeIxs: TransactionInstruction[];
    claimIxs: TransactionInstruction[];
    payRMakerIxs: TransactionInstruction[];
    payRTakerIxs: TransactionInstruction[];
    closeSIxs: TransactionInstruction[];
    cEnvOpts: CEnvOpts;
    signer: string;
    takeArgs: TakeSArg;
    connection: Connection;
}) {
    let takeTx: VersionedTransaction | undefined;
    let claimTx: VersionedTransaction | undefined;
    let payMakerTx: VersionedTransaction | undefined;
    let payTakerTx: VersionedTransaction | undefined;
    let closeTx: VersionedTransaction | undefined;
    let BT: BTv[] = [];

    if (makerNftStd === "compressed" || takerNftStd === "compressed") {
        console.log("not clump");
        if (!acceptedBid) {
            BT.push(
                appendToBT({
                    BT,
                    tx: await ix2vTx(takeIxs, cEnvOpts, signer),
                    description: DESC.takeSwap,
                    details: takeArgs,
                })
            );
        }
        if (!claimed) {
            BT.push(
                appendToBT({
                    BT,
                    tx: await ix2vTx(claimIxs, cEnvOpts, signer),
                    description: DESC.claimSwap,
                    details: takeArgs,
                })
            );
        }

        if (makerNftStd !== "compressed") {
            if (!royaltiesPaidMaker) {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(payRMakerIxs, cEnvOpts, signer),
                        description: DESC.payRoyalties,
                        details: takeArgs,
                    })
                );
            }
            if (!royaltiesPaidTaker) {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(payRTakerIxs.concat(closeSIxs), cEnvOpts, signer),
                        description: DESC.close,
                        details: takeArgs,
                    })
                );
            } else {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(closeSIxs, cEnvOpts, signer),
                        description: DESC.close,
                        details: takeArgs,
                    })
                );
            }
        } else if (takerNftStd !== "compressed") {
            if (!royaltiesPaidTaker) {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(payRTakerIxs, cEnvOpts, signer),
                        description: DESC.payRoyalties,
                        details: takeArgs,
                    })
                );
            }
            if (!royaltiesPaidMaker) {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(payRMakerIxs.concat(closeSIxs), cEnvOpts, signer),
                        description: DESC.close,
                        details: takeArgs,
                    })
                );
            } else {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(closeSIxs, cEnvOpts, signer),
                        description: DESC.close,
                        details: takeArgs,
                    })
                );
            }
        } else {
            BT.push(
                appendToBT({
                    BT,
                    tx: await ix2vTx(payRMakerIxs, cEnvOpts, signer),
                    description: DESC.payMakerRoyalties,
                    details: takeArgs,
                })
            );
            BT.push(
                appendToBT({
                    BT,
                    tx: await ix2vTx(payRTakerIxs, cEnvOpts, signer),
                    description: DESC.payTakerRoyalties,
                    details: takeArgs,
                })
            );
            BT.push(
                appendToBT({
                    BT,
                    tx: await ix2vTx(closeSIxs, cEnvOpts, signer),
                    description: DESC.close,
                    details: takeArgs,
                })
            );
        }
    } else {
        console.log("clump");
        let clumpAccept = [];
        try {
            if (!acceptedBid) clumpAccept.push(...takeIxs);
            if (!claimed) clumpAccept.push(...claimIxs);
            if (clumpAccept.length > 0) {
                let testVtx = appendToBT({
                    tx: await ix2vTx(clumpAccept, cEnvOpts, signer),
                    BT,
                    description: DESC.takeSwap,
                    details: takeArgs,
                });

                let seri = testVtx.tx.serialize().length;
                console.log("seri length", seri);
                if (seri > 1232) {
                    throw "takeSwapIx too large";
                } else BT.push(testVtx);
            }
        } catch (error) {
            console.log("clumpAccept error", error);

            if (!acceptedBid) {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(takeIxs, cEnvOpts, signer),
                        description: DESC.takeSwap,
                        details: takeArgs,
                    })
                );
            }
            if (!claimed) {
                BT.push(
                    appendToBT({
                        BT,
                        tx: await ix2vTx(claimIxs, cEnvOpts, signer),
                        description: DESC.claimSwap,
                        details: takeArgs,
                    })
                );
            }
        }

        let clumpClose = [];
        if (!royaltiesPaidMaker) clumpClose.push(...payRMakerIxs);
        if (!royaltiesPaidTaker) clumpClose.push(...payRTakerIxs);
        clumpClose.push(...closeSIxs);
        if (clumpClose.length > 0)
            BT.push(
                appendToBT({
                    tx: await ix2vTx(clumpClose, cEnvOpts, signer),
                    BT,
                    description: DESC.close,
                    details: takeArgs,
                })
            );
    }

    let { lastValidBlockHeight: blockheight, blockhash } = await connection.getLatestBlockhash();

    BT.map((b, i) => {
        b.tx.message.recentBlockhash = blockhash;
        b.blockheight = blockheight;
        console.log(i, "b serialized size", b.description, b.tx.serialize().length);
    });
    return BT;
}
