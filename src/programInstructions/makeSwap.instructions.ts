import { getProgram } from "../utils/getProgram.obj";
import {
    Cluster,
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { Bid, EnvOpts, ErrorFeedback, MakeSArg, MakeSwapData, ScBid } from "../utils/types";
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
import { bidToscBid } from "../utils/typeSwap";
import { DESC } from "../utils/descriptions";

export async function createMakeSwapInstructions(Data: MakeSArg & EnvOpts): Promise<MakeSwapData> {
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
    console.log("v0.0.1");

    let connection = Data.program.provider.connection;
    let dummyBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let swapDataAccount = getSda(Data.maker, Data.nftMintMaker, Data.program.programId.toString());
    console.log("swapDataAccount", swapDataAccount);

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 500000,
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
            console.log("swapDataAccountNftAta", swapDataAccountNftAta);
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
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintMaker,
            owner: Data.maker,
            signer: Data.maker,
        });
        if (!mn) console.log("makerNftAta", makerNftAta);

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: Data.paymentMint,
            owner: Data.maker,
            signer: Data.maker,
        });
        if (!mt) console.log("makerTokenAta", makerTokenAta);

        const { metadataAddress: nftMetadataMaker, tokenStandard } =
            await findNftDataAndMetadataAccount({
                connection: Data.program.provider.connection,
                mint: Data.nftMintMaker,
            });

        let nftMasterEditionMaker = Data.maker;
        let ownerTokenRecordMaker = Data.maker;
        let destinationTokenRecordMaker = Data.maker;
        let authRulesMaker = Data.maker;

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
                userMintAta: swapDataAccountNftAta,
            });

            const authRulesF = await findRuleSet({
                connection,
                mint: Data.nftMintMaker,
            });
            nftMasterEditionMaker = nftMasterEditionF;
            ownerTokenRecordMaker = ownerTokenRecordF;
            destinationTokenRecordMaker = destinationTokenRecordF;
            authRulesMaker = authRulesF;
        }
        console.log("bid", bidToscBid(Data.bid));
        console.log(
            "swapDataAccounts:",
            swapDataAccount,
            "swapDataAccountNftAtas:",
            swapDataAccountNftAta,
            "swapDataAccountTokenAtas:",
            swapDataAccountTokenAta,

            "maker:",
            Data.maker,
            "makerNftAta:",
            makerNftAta,
            "makerTokenAta:",
            makerTokenAta,

            "nftMintMaker:",
            Data.nftMintMaker,
            "mintToken:",
            Data.paymentMint,

            "nftMetadataMaker:",
            nftMetadataMaker,
            "nftMasterEditionMaker:",
            nftMasterEditionMaker,
            "ownerTokenRecordMaker:",
            ownerTokenRecordMaker,
            "destinationTokenRecordMaker:",
            destinationTokenRecordMaker,
            "authRulesMaker:",
            authRulesMaker,

            "systemProgram:",
            SystemProgram.programId,
            "metadataProgram:",
            TOKEN_METADATA_PROGRAM,
            "sysvarInstructions:",
            SYSVAR_INSTRUCTIONS_PUBKEY,
            "tokenProgram:",
            TOKEN_PROGRAM_ID,
            "ataProgram:",
            SOLANA_SPL_ATA_PROGRAM_ID,
            "authRulesProgram:",
            METAPLEX_AUTH_RULES_PROGRAM
        );
        const initIx = await Data.program.methods
            .makeSwap(bidToscBid(Data.bid), new BN(Data.endDate))
            .accounts({
                swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                maker: Data.maker,
                makerNftAta,
                makerTokenAta,

                nftMintMaker: Data.nftMintMaker,
                mintToken: Data.paymentMint,

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
        instructions.push(initIx);

        const tx = new Transaction().add(...instructions);
        tx.feePayer = new PublicKey(Data.maker);
        tx.recentBlockhash = dummyBlockhash;
        // // let simu = await connection.simulateTransaction(tx);
        // // console.log("simu", simu.value);
        // const txSig = await connection.sendTransaction(tx, [maker]);
        // console.log("txSig", txSig);

        return {
            bTx: {
                description: DESC.makeSwap,
                details: {
                    bid: Data.bid,
                    endDate: Data.endDate,
                    maker: Data.maker,
                    nftMintMaker: Data.nftMintMaker,
                    paymentMint: Data.paymentMint,
                },
                priority: 0,
                status: "pending",
                tx,
                blockheight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            },
            swapDataAccount: swapDataAccount.toString(),
        };
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
