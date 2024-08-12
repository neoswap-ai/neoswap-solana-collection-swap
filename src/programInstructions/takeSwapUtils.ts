import { BN, Program } from "@coral-xyz/anchor";
import { Bid } from "../utils/types";
import { bidToscBid } from "../utils/typeSwap";
import { CollectionSwap } from "../utils/neoSwap.idl";
import {
    findNftDataAndMetadataAccount,
    findPnftAccounts,
    getHashlistMarker,
} from "../utils/findNftDataAndAccounts.function";
import { Cluster, Connection, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SPL_ASSOCIATED_TOKEN_PROGRAM_ID } from "@metaplex-foundation/mpl-toolbox";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { METAPLEX_AUTH_RULES_PROGRAM, TOKEN_METADATA_PROGRAM } from "../utils/const";
import { getCompNFTData } from "../utils/compressedHelper";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

export async function takeSwap22Ix({
    bid,
    maker,
    makerNftAta,
    makerTokenAta,
    nftMintTaker,
    swapDataAccount,
    swapDataAccountTokenAta,
    taker,
    takerNftAta,
    takerTokenAta,
    program,
    n,
}: {
    program: Program<CollectionSwap>;

    bid: Bid;
    swapDataAccount: string;
    swapDataAccountTokenAta: string;

    maker: string;
    makerNftAta: string;
    makerTokenAta: string;

    taker: string;
    takerNftAta: string;
    takerTokenAta: string;

    nftMintTaker: string;

    n: number;
}) {
    let makerhashlistMarker = await getHashlistMarker({
        collection: bid.collection,
        nftMintTaker,
    });
    console.log("makerhashlistMarker", makerhashlistMarker);

    return await program.methods
        .takeSwap22(bidToscBid(bid), n)
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
}

export async function takeSwapIx({
    connection,
    makerNftAta,
    nftMetadataTaker,
    nftMintTaker,
    program,
    takerNftAta,
    tokenStandardTaker,
    maker,
    makerTokenAta,
    swapDataAccount,
    swapDataAccountTokenAta,
    taker,
    takerTokenAta,
    bid,
    n,
}: {
    connection: Connection;
    bid: Bid;
    n: number;

    tokenStandardTaker: TokenStandard;
    nftMintTaker: string;
    nftMetadataTaker: string;

    swapDataAccount: string;
    swapDataAccountTokenAta: string;

    maker: string;
    makerNftAta: string;
    makerTokenAta: string;

    taker: string;
    takerNftAta: string;
    takerTokenAta: string;

    program: Program<CollectionSwap>;
}) {
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

    return await program.methods
        .takeSwap(bidToscBid(bid), n)
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

            systemProgram: SystemProgram.programId,
            metadataProgram: TOKEN_METADATA_PROGRAM,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            ataProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
            authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
        })
        .instruction();
}

export async function takeSwapCompIx({
    cluster,
    program,
    tokenId,
    takerAmount,
    n,
    maker,
    makerTokenAta,
    swapDataAccount,
    swapDataAccountTokenAta,
    taker,
    takerTokenAta,
}: {
    cluster: Cluster;
    tokenId: string;
    // collection: string;
    takerAmount: number;
    n: number;

    swapDataAccount: string;
    swapDataAccountTokenAta: string;
    maker: string;
    makerTokenAta: string;
    taker: string;
    takerTokenAta: string;

    program: Program<CollectionSwap>;
}) {
    let {
        creatorHash,
        dataHash,
        leafHash,
        index,
        merkleTree,
        nonce,
        proofMeta,
        root,
        treeAuthority,
        metadata,
    } = await getCompNFTData({
        cluster,
        tokenId,
        connection: program.provider.connection,
        getRootHash: "onchain",
        // newOwner,
    });
    if (!metadata) throw "Compressed no metadata found";
    if (metadata.collection == null) throw "Compressed no collection found";
    console.log("takeswap root", root, leafHash);

    return await program.methods
        .takeSwapComp(
            metadata.collection,
            new BN(takerAmount),
            Array.from(root),
            metadata.name,
            metadata.symbol,
            metadata.uri,
            metadata.sellerFeeBasisPoints,
            metadata.primarySaleHappened,
            metadata.isMutable,
            metadata.editionNonce,
            metadata.creators,
            nonce,
            index,
            n
        )
        .accountsStrict({
            swapDataAccount,
            swapDataAccountTokenAta,
            maker,
            makerTokenAta,
            merkleTree,
            treeAuthority,
            taker,
            takerTokenAta,
            bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
            logWrapper: SPL_NOOP_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(proofMeta)
        .instruction();
}
