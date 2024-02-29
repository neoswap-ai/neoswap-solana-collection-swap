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
} from "@solana/web3.js";
import {
    Bid,
    ErrorFeedback,
    InitializeData,
    NftSwapItem,
    SwapData,
    SwapIdentity,
    TokenSwapItem,
} from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { getCNFTOwner } from "../utils/getCNFTData.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../utils/const";
import { delay } from "../utils/delay";
import { BN } from "bn.js";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { getSda } from "../utils/getPda";

export async function createMakeSwapInstructions(Data: {
    maker: PublicKey;
    nftMintMaker: PublicKey;
    paymentMint: PublicKey;
    bid: Bid;
    duration: number;
    clusterOrUrl?: Cluster | string;
    program?: Program;
}): Promise<InitializeData> {
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

    let swapDataAccount = getSda(Data.maker, Data.nftMintMaker, Data.program.programId);
    console.log("swapDataAccount", swapDataAccount.toBase58());

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 300000,
        }),
    ];

    try {
        let { mintAta: swapDataAccountNftAta, instruction: swapDataAccountNftAtaIx } =
            await findOrCreateAta({
                connection,
                mint: Data.nftMintMaker,
                owner: swapDataAccount,
                signer: Data.maker,
            });
        if (swapDataAccountNftAtaIx) {
            instructions.push(swapDataAccountNftAtaIx);
            console.log("swapDataAccountNftAta", swapDataAccountNftAta.toBase58());
        }

        let { mintAta: swapDataAccountTokenAta, instruction: swapDataAccountTokenAtaIx } =
            await findOrCreateAta({
                connection,
                mint: Data.paymentMint,
                owner: swapDataAccount,
                signer: Data.maker,
            });
        if (swapDataAccountTokenAtaIx) {
            instructions.push(swapDataAccountTokenAtaIx);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintMaker,
            owner: Data.maker,
            signer: Data.maker,
        });
        if (!mn) console.log("makerNftAta", makerNftAta.toBase58());

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: Data.paymentMint,
            owner: Data.maker,
            signer: Data.maker,
        });
        if (!mt) console.log("makerTokenAta", makerTokenAta.toBase58());

        const { metadataAddress: nftMetadata, tokenStandard } = await findNftDataAndMetadataAccount(
            { connection: Data.program.provider.connection, mint: Data.nftMintMaker }
        );

        let nftMasterEdition = Data.maker;
        let ownerTokenRecord = Data.maker;
        let destinationTokenRecord = Data.maker;
        let authRules = Data.maker;

        if (tokenStandard == TokenStandard.ProgrammableNonFungible) {
            const nftMasterEditionF = findNftMasterEdition({
                mint: Data.nftMintMaker,
            });

            const ownerTokenRecordF = findUserTokenRecord({
                mint: Data.nftMintMaker,
                userMintAta: makerNftAta,
            });

            const destinationTokenRecordF = findUserTokenRecord({
                mint: Data.nftMintMaker,
                userMintAta: makerNftAta,
            });

            const authRulesF = await findRuleSet({
                connection,
                mint: Data.nftMintMaker,
            });
            nftMasterEdition = nftMasterEditionF;
            ownerTokenRecord = ownerTokenRecordF;
            destinationTokenRecord = destinationTokenRecordF;
            authRules = authRulesF;
        }
        console.log("bid", Data.bid);

        const initIx = await Data.program.methods
            .makeSwap(Data.bid, new BN(Data.duration))
            .accounts({
                swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                maker: Data.maker,
                makerNftAta,
                makerTokenAta,

                mintNft: Data.nftMintMaker,
                mintToken: Data.paymentMint,

                nftMetadata,
                nftMasterEdition,
                ownerTokenRecord,
                destinationTokenRecord,
                authRules,

                systemProgram: SystemProgram.programId,
                metadataProgram: TOKEN_METADATA_PROGRAM,
                sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
                ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
            })
            .instruction();
        instructions.push(initIx);

        const tx = new Transaction().add(...instructions);
        tx.feePayer = Data.maker;
        tx.recentBlockhash = dummyBlockhash;
        // // let simu = await connection.simulateTransaction(tx);
        // // console.log("simu", simu.value);
        // const txSig = await connection.sendTransaction(tx, [maker]);
        // console.log("txSig", txSig);

        return {
            tx,
            swapDataAccount,
        };
    } catch (error: any) {
        console.log("error init", error);

        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            swapDataAccount: swapDataAccount.toBase58(),
        };
    }
}
