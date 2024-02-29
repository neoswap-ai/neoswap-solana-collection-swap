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
import { getCreatorData } from "../utils/creators";

export async function createPayRoyaltiesInstructions(Data: {
    swapDataAccount: PublicKey;
    taker?: PublicKey;
    nftMintTaker?: PublicKey;
    bid?: Bid;
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
            units: 300000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program: Data.program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount.toBase58();
        let { paymentMint, maker, nftMintMaker, taker, nftMintTaker, acceptedBid } = swapDataData;

        if (!taker && !!Data.taker) taker = Data.taker;
        if (!nftMintTaker && !!Data.nftMintTaker) nftMintTaker = Data.nftMintTaker;
        if (!acceptedBid && !!Data.bid) acceptedBid = Data.bid;

        if (!(nftMintTaker && taker && acceptedBid)) {
            throw "SDA doesnt have accepted bids" + JSON.stringify(swapDataData);
        }

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: taker,
            signer: taker,
        });
        if (tn) {
            instructions.push(tn);
            console.log("takerNftAta", takerNftAta.toBase58());
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer: taker,
        });
        if (tt) {
            instructions.push(tt);
            console.log("takerTokenAta", takerTokenAta.toBase58());
        }

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: maker,
            signer: taker,
        });
        if (mn) {
            instructions.push(mn);
            console.log("makerNftAta", makerNftAta.toBase58());
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: taker,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta.toBase58());
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.swapDataAccount,
            signer: taker,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
        }
        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer: taker,
        });
        if (nst) {
            instructions.push(nst);
            console.log("nsFeeTokenAta", nsFeeTokenAta.toBase58());
        }

        let {
            makerCreator,
            makerCreatorTokenAta,
            takerCreator,
            takerCreatorTokenAta,
            instructions: creatorIxs,
        } = await getCreatorData({ connection, nftMintMaker, paymentMint, taker, nftMintTaker });

        if (creatorIxs) instructions.push(...creatorIxs);

        const { metadataAddress: takerNftMetadata } = await findNftDataAndMetadataAccount({
            connection: Data.program.provider.connection,
            mint: nftMintTaker,
        });
        console.log("takerNftMetadata", takerNftMetadata.toBase58());

        const { metadataAddress: makerNftMetadata } = await findNftDataAndMetadataAccount({
            connection: Data.program.provider.connection,
            mint: nftMintMaker,
        });
        console.log("makerNftMetadata", makerNftMetadata.toBase58());

        const initIx = await Data.program.methods
            .payRoyalties()
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                swapDataAccountTokenAta,

                maker,
                makerNftAta,
                makerTokenAta,

                taker,
                takerNftAta,
                takerTokenAta,

                nsFee: NS_FEE,
                nsFeeTokenAta,

                takerMintNft: nftMintTaker,
                mintToken: paymentMint,

                takerNftMetadata,
                makerNftMetadata,

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
        instructions.push(initIx);

        const tx = new Transaction().add(...instructions);
        tx.feePayer = Data.taker;
        tx.recentBlockhash = dummyBlockhash;
        // // let simu = await connection.simulateTransaction(tx);
        // // console.log("simu", simu.value);
        // const txSig = await connection.sendTransaction(tx, [maker]);
        // console.log("txSig", txSig);

        return tx;
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
