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
import {
    ErrorFeedback,
    EnvOpts,
    BundleTransaction,
    ClaimArg,
    BTClaim,
    BTv,
    vT,
} from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
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
import { addPriorityFee } from "../utils/fees";
import { refreshBTBlockhash } from "../utils/refreshBTBlockhash";
import { checkEnvOpts, getClaimArgs, getMakeArgs } from "../utils/check";

export async function createCancelSwapInstructions(
    Data: EnvOpts & ClaimArg
): Promise<BundleTransaction> {
    console.log(VERSION);
    let cEnvOpts = checkEnvOpts(Data);
    let { program, prioritizationFee } = cEnvOpts;
    let claimSArgs = getClaimArgs(Data);
    let { signer, swapDataAccount } = claimSArgs;

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

        const { mintToken, maker, nftMintMaker } = swapDataData;

        let { mintAta: makerNftAta, instruction: mN } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: maker,
            signer: signer,
        });
        if (mN) {
            console.log("adding );");
            instructions.push(mN);
        }

        let { mintAta: makerTokenAta, instruction: mT } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: maker,
            signer: signer,
        });
        if (mT) {
            console.log("adding );");
            instructions.push(mT);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdaT } = await findOrCreateAta({
            connection,
            mint: mintToken,
            owner: swapDataAccount,
            signer: signer,
        });
        if (sdaT) {
            console.log("adding sdaT");
            instructions.push(sdaT);
        }

        let { mintAta: swapDataAccountNftAta, instruction: sdaN } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: swapDataAccount,
            signer: signer,
        });

        if (sdaN) {
            console.log("adding sdaN");
            instructions.push(sdaN);
        }

        let { mintAta: takerNftAtaMaker, instruction: tmN } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: maker,
            signer: signer,
        });
        if (tmN) {
            console.log("adding tmN");
            instructions.push(tmN);
        }

        const { metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
            await findNftDataAndMetadataAccount({
                connection,
                mint: nftMintMaker,
            });

        let nftMasterEditionMaker = signer;
        let ownerTokenRecordMaker = signer;
        let destinationTokenRecordMaker = signer;
        let authRulesMaker = signer;

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

        const cancelIx = await program.methods
            .cancelSwap()
            .accounts({
                signer: signer,

                swapDataAccount: swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                maker,
                makerNftAta,
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
        console.log("adding cancelIx");
        instructions.push(cancelIx);

        let cancelSwapTx = new Transaction().add(...instructions);
        cancelSwapTx = await addPriorityFee(cancelSwapTx, prioritizationFee);
        cancelSwapTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        cancelSwapTx.feePayer = new PublicKey(signer);
        let bt = {
            tx: new VersionedTransaction(cancelSwapTx.compileMessage()),
            description: DESC.cancelSwap,
            details: Data,
            priority: 0,
            blockheight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            status: "pending",
        } as BundleTransaction;

        return (await refreshBTBlockhash([bt], cEnvOpts))[0];
    } catch (error: any) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            swapDataAccount: swapDataAccount,
        };
    }
}
