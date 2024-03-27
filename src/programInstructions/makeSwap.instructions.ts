import { getProgram } from "../utils/getProgram.obj";
import {
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
import { EnvOpts, ErrorFeedback, MakeSArg, MakeSwapData } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
    VERSION,
} from "../utils/const";
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
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addPriorityFee } from "../utils/fees";
import { addWSol } from "../utils/wsol";
import { checkEnvOpts, checkOptionSend, getMakeArgs } from "../utils/check";
import { ix2vTx } from "../utils/vtx";

export async function createMakeSwapInstructions(Data: MakeSArg & EnvOpts): Promise<MakeSwapData> {
    console.log(VERSION);

    let cOptionSend = checkOptionSend(Data);
    let cEnvOpts = checkEnvOpts(Data);
    let makeArgs = getMakeArgs(Data);
    let { connection, prioritizationFee } = cOptionSend;
    let { program } = cEnvOpts;
    let { bid, endDate, maker, nftMintMaker, paymentMint } = makeArgs;

    let swapDataAccount = getSda(maker, nftMintMaker, program.programId.toString());
    console.log("swapDataAccount", swapDataAccount);

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];

    try {
        let { mintAta: swapDataAccountNftAta, instruction: sn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: swapDataAccount,
            signer: maker,
        });
        if (sn) instructions.push(sn);
        else console.log("swapDataAccountNftAta", swapDataAccountNftAta);

        let { mintAta: swapDataAccountTokenAta, instruction: st } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer: maker,
        });
        if (st) instructions.push(st);
        else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

        let { mintAta: makerNftAta, instruction: mn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: maker,
            signer: maker,
        });
        if (mn) instructions.push(mn);
        else console.log("makerNftAta", makerNftAta);

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: maker,
        });
        if (mt) instructions.push(mt);
        else console.log("makerTokenAta", makerTokenAta);

        const { metadataAddress: nftMetadataMaker, tokenStandard } =
            await findNftDataAndMetadataAccount({
                connection: program.provider.connection,
                mint: nftMintMaker,
            });

        let nftMasterEditionMaker = maker;
        let ownerTokenRecordMaker = maker;
        let destinationTokenRecordMaker = maker;
        let authRulesMaker = maker;

        if (tokenStandard == TokenStandard.ProgrammableNonFungible) {
            const nftMasterEditionF = findNftMasterEdition({
                mint: nftMintMaker,
            });

            const ownerTokenRecordF = findUserTokenRecord({
                mint: nftMintMaker,
                userMintAta: makerNftAta,
            });

            const destinationTokenRecordF = findUserTokenRecord({
                mint: nftMintMaker,
                userMintAta: swapDataAccountNftAta,
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

        // if wSOL
        if (paymentMint === WRAPPED_SOL_MINT.toString()) {
            let amount = bid.makerNeoswapFee + bid.makerRoyalties;
            if (bid.amount < 0) amount += -bid.amount;
            console.log(
                "Wrapping ",
                amount,
                " ( ",
                amount / LAMPORTS_PER_SOL,
                " ) lamports to wSOL"
            );

            instructions.push(...addWSol(maker, makerTokenAta, amount));
        }
        console.log("bid", bid);

        const initIx = await program.methods
            .makeSwap(bidToscBid(bid), new BN(endDate))
            .accounts({
                swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                maker: maker,
                makerNftAta,
                makerTokenAta,

                nftMintMaker: nftMintMaker,
                paymentMint: paymentMint,

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

        return {
            bTx: {
                description: DESC.makeSwap,
                details: Data,
                priority: 0,
                status: "pending",
                tx: await ix2vTx(instructions, cEnvOpts, maker),
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
