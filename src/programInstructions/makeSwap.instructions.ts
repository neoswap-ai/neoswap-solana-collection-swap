import {
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import { BTv, EnvOpts, MakeSArg, ReturnSwapData, UpdateSArgs } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
import { addWSol } from "../utils/wsol";
import { checkEnvOpts, getMakeArgs } from "../utils/check";
import { ix2vTx } from "../utils/vtx";
import { createAddBidIx } from "./modifyAddBid.instructions";

export async function createMakeSwapInstructions(
    Data: MakeSArg & EnvOpts
): Promise<ReturnSwapData> {
    console.log(VERSION);
    let cEnvOpts = await checkEnvOpts(Data);
    let makeArgs = getMakeArgs(Data);
    let { program, connection } = cEnvOpts;
    let { bids, endDate, maker, nftMintMaker, paymentMint } = makeArgs;

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

        let {
            mintAta: makerNftAta,
            instruction: mn,
            tokenProgram,
        } = await findOrCreateAta({
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

        let nftMasterEditionMaker = maker;
        let ownerTokenRecordMaker = maker;
        let destinationTokenRecordMaker = maker;
        let authRulesMaker = maker;
        let nftMetadataMaker = maker;

        if (tokenProgram === TOKEN_PROGRAM_ID.toString()) {
            console.log("tokenProgram", tokenProgram);

            const { metadataAddress: nftMetadataMakerF, tokenStandard } =
                await findNftDataAndMetadataAccount({
                    connection: program.provider.connection,
                    mint: nftMintMaker,
                });
            nftMetadataMaker = nftMetadataMakerF;
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
                nftMetadataMaker = nftMetadataMakerF;
            }
        } else if (tokenProgram === TOKEN_2022_PROGRAM_ID.toString()) {
            tokenProgram = TOKEN_2022_PROGRAM_ID.toString();
            console.log("token22Program", tokenProgram);
        }
        bids = bids.sort((bidA, bidB) => {
            let amountA = bidA.makerNeoswapFee + bidA.makerRoyalties;
            if (bidA.amount < 0) amountA += -bidA.amount;
            let amountB = bidB.makerNeoswapFee + bidB.makerRoyalties;
            if (bidB.amount < 0) amountB += -bidB.amount;
            return amountB - amountA;
        });
        // if wSOL
        if (paymentMint === WRAPPED_SOL_MINT.toString()) {
            let maxAmount = 0;
            bids.map((bid) => {
                let amount = bid.makerNeoswapFee + bid.makerRoyalties;
                if (bid.amount < 0) amount += -bid.amount;
                maxAmount = Math.max(maxAmount, amount);
            });
            console.log(
                "Wrapping " +
                    maxAmount +
                    " ( " +
                    maxAmount / LAMPORTS_PER_SOL +
                    " ) lamports to wSOL"
            );

            instructions.push(...addWSol(maker, makerTokenAta, maxAmount));
        }
        console.log("tokenProgram", tokenProgram);

        console.log("bids", bids);
        let oneBid = bids[0];
        let leftBids = bids.slice(1).length > 0 ? bids.slice(1) : [];

        if (tokenProgram === TOKEN_PROGRAM_ID.toString()) {
            // console.log("tokenProgram createIX", program);
            const initIx = await program.methods
                .makeSwap(bidToscBid(oneBid), new BN(endDate))
                .accounts({
                    swapDataAccount,
                    swapDataAccountNftAta,
                    swapDataAccountTokenAta,

                    maker: maker,
                    makerNftAta,
                    makerTokenAta,

                    nftMintMaker: nftMintMaker,
                    paymentMint,

                    nftMetadataMaker,
                    nftMasterEditionMaker,
                    ownerTokenRecordMaker,
                    destinationTokenRecordMaker,
                    authRulesMaker,

                    systemProgram: SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                })
                .instruction();
            instructions.push(initIx);
        } else if (tokenProgram === TOKEN_2022_PROGRAM_ID.toString()) {
            // console.log("token22Program createIX", idlSwap, program);

            const initIx = await program.methods
                .makeSwap22(bidToscBid(oneBid), new BN(endDate))
                .accounts({
                    swapDataAccount,
                    swapDataAccountNftAta,
                    swapDataAccountTokenAta,

                    maker: maker,
                    makerNftAta,
                    makerTokenAta,

                    nftMintMaker: nftMintMaker,
                    paymentMint,

                    // nftMetadataMaker,
                    // nftMasterEditionMaker,
                    // ownerTokenRecordMaker,
                    // destinationTokenRecordMaker,
                    // authRulesMaker,

                    systemProgram: SystemProgram.programId,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    tokenProgram22: TOKEN_2022_PROGRAM_ID,
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                })
                .instruction();
            instructions.push(initIx);
        }

        let addBidIxs: TransactionInstruction[] = [];
        if (leftBids.length > 0) {
            let bidDataIxs = await createAddBidIx({
                swapDataAccount,
                bids: leftBids,
                maker,
                paymentMint,
                makerTokenAta,
                swapDataAccountTokenAta,
                ...cEnvOpts,
            });
            instructions.push(...bidDataIxs.ataIxs);
            addBidIxs = bidDataIxs.bidIxs;
            if (addBidIxs.length <= 3) {
                instructions.push(...addBidIxs);
                addBidIxs = [];
            } else {
                instructions.push(...addBidIxs.slice(0, 3));
                addBidIxs = addBidIxs.slice(3);
            }
        }

        let bTxs: BTv[] = [
            {
                description: DESC.makeSwap,
                details: Data,
                priority: 0,
                status: "pending",
                tx: await ix2vTx(instructions, cEnvOpts, maker),
            },
        ];
        console.log("addBidIxs", addBidIxs.length);

        if (addBidIxs.length > 0)
            bTxs.push({
                description: DESC.addBid,
                details: { swapDataAccount, bids, maker } as UpdateSArgs,
                priority: 1,
                status: "pending",
                tx: await ix2vTx(addBidIxs, cEnvOpts, maker),
            });
        return {
            bTxs,
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
