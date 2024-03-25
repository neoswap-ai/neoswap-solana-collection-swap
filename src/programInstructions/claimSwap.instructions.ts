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
    VersionedTransaction,
} from "@solana/web3.js";
import { BundleTransaction, ClaimArg, EnvOpts, ErrorFeedback } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { getCNFTOwner } from "../utils/getCNFTData.function";
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
    VERSION,
} from "../utils/const";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { DESC } from "../utils/descriptions";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addPriorityFee } from "../utils/fees";
import { closeWSol } from "../utils/wsol";
import { checkEnvOpts, getClaimArgs, getMakeArgs } from "../utils/check";

export async function createClaimSwapInstructions(
    Data: EnvOpts & ClaimArg
): Promise<BundleTransaction> {
    console.log(VERSION);
    let cEnvOpts = checkEnvOpts(Data);
    let { program, prioritizationFee } = cEnvOpts;
    let claimSArg = getClaimArgs(Data);
    let { signer, swapDataAccount } = claimSArg;

    let connection = program.provider.connection;

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program: program,
            swapDataAccount: swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;
        let { mintToken, maker, nftMintMaker, taker, nftMintTaker, acceptedBid } = swapDataData;

        if (!(nftMintTaker && taker && acceptedBid))
            throw "SDA doesnt have accepted bids" + JSON.stringify(swapDataData);

        let { mintAta: swapDataAccountNftAta, instruction: sdan } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: swapDataAccount,
            signer: signer,
        });
        if (sdan) instructions.push(sdan);
        else console.log("swapDataAccountNftAta", swapDataAccountNftAta);
        let { mintAta: takerNftAtaMaker, instruction: tmn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: taker,
            signer: signer,
        });
        if (tmn) instructions.push(tmn);
        else console.log("takerNftAta", takerNftAtaMaker);

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: taker,
            signer: signer,
        });
        if (tt) instructions.push(tt);
        else console.log("takerTokenAta", takerTokenAta);

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: NS_FEE,
            signer: signer,
        });
        if (nst) instructions.push(nst);
        else console.log("nsFeeTokenAta", nsFeeTokenAta);

        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: swapDataAccount,
            signer: signer,
        });
        if (sdat) instructions.push(sdat);
        else console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: maker,
            signer: signer,
        });
        if (mt) instructions.push(mt);
        else console.log("makerTokenAta", makerTokenAta);

        const { metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
            await findNftDataAndMetadataAccount({
                connection,
                mint: nftMintMaker,
            });

        console.log("nftMetadataMaker", nftMetadataMaker);

        let nftMasterEditionMaker = taker;
        let ownerTokenRecordMaker = taker;
        let destinationTokenRecordMaker = taker;
        let authRulesMaker = taker;
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
                userMintAta: takerNftAtaMaker,
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
                swapDataAccount: swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                nsFee: NS_FEE,
                nsFeeTokenAta,

                signer: signer,
                taker: taker,
                takerNftAtaMaker,
                takerTokenAta,

                maker,
                // makerNftAta,
                makerTokenAta,

                nftMintMaker,
                mintToken: mintToken,

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

        if (swapDataData.mintToken === WRAPPED_SOL_MINT.toString())
            if (signer === taker) instructions.push(closeWSol(taker, taker, takerTokenAta));
            else if (signer === maker) instructions.push(closeWSol(maker, maker, makerTokenAta));
        let tx = new Transaction().add(...instructions);
        tx = await addPriorityFee(tx, prioritizationFee);
        tx.feePayer = new PublicKey(signer);
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        return {
            tx: new VersionedTransaction(tx.compileMessage()),
            description: DESC.claimSwap,
            details: Data,
            priority: 0,
            status: "pending",
        } as BundleTransaction;
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
