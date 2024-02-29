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
    NS_FEE,
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

export async function createTakeSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    taker: PublicKey;
    nftMintTaker: PublicKey;
    bid: Bid;
    clusterOrUrl?: Cluster | string;
    program?: Program;
}): Promise<Transaction> {
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

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 250000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program: Data.program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount.toBase58();
        const { paymentMint, maker, nftMintMaker, bids } = swapDataData;
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
        if (!foundBid)
            throw `bid ${JSON.stringify(Data.bid)} not found in ${JSON.stringify(bids)} `;

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintTaker,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tn) {
            instructions.push(tn);
            console.log("takerNftAta", takerNftAta.toBase58());
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tt) {
            instructions.push(tt);
            console.log("takerTokenAta", takerTokenAta.toBase58());
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: Data.nftMintTaker,
            owner: maker,
            signer: Data.taker,
        });
        if (mn) {
            instructions.push(mn);
            console.log("makerNftAta", makerNftAta.toBase58());
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: Data.taker,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta.toBase58());
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.swapDataAccount,
            signer: Data.taker,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
        }

        const { metadataAddress: nftMetadata, tokenStandard } = await findNftDataAndMetadataAccount(
            { connection: Data.program.provider.connection, mint: Data.nftMintTaker }
        );
        console.log("nftMetadata", nftMetadata.toBase58());

        let nftMasterEdition = maker;
        let ownerTokenRecord = maker;
        let destinationTokenRecord = maker;
        let authRules = maker;

        if (tokenStandard == TokenStandard.ProgrammableNonFungible) {
            const nftMasterEditionF = findNftMasterEdition({
                mint: Data.nftMintTaker,
            });
            console.log("nftMasterEditionF", nftMasterEditionF.toBase58());

            const ownerTokenRecordF = findUserTokenRecord({
                mint: Data.nftMintTaker,
                userMintAta: makerNftAta,
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

            nftMasterEdition = nftMasterEditionF;
            ownerTokenRecord = ownerTokenRecordF;
            destinationTokenRecord = destinationTokenRecordF;
            authRules = authRulesF;
        }
        console.log("bid", Data.bid);

        const initIx = await Data.program.methods
            .takeSwap(Data.bid)
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
        tx.feePayer = Data.taker;
        tx.recentBlockhash = dummyBlockhash;
        // // let simu = await connection.simulateTransaction(tx);
        // // console.log("simu", simu.value);
        // const txSig = await connection.sendTransaction(tx, [maker]);
        // console.log("txSig", txSig);

        return tx;
        // {
        //     tx,
        //     swapDataAccount,
        // };
    } catch (error: any) {
        console.log("error init", error);

        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            swapDataAccount: Data.swapDataAccount.toBase58(),
        };
    }
}
