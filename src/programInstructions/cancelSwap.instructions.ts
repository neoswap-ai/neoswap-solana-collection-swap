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
import { ErrorFeedback, EnvOpts, BundleTransaction } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../utils/const";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { DESC } from "../utils/descriptions";

export async function createCancelSwapInstructions(
    Data: EnvOpts & {
        swapDataAccount: string;
    }
): Promise<BundleTransaction> {
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
    let microLamports = ((await connection.getRecentPrioritizationFees())[0].prioritizationFee * 2);

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports,
        }),
    ];
    try {
        let swapDataData = await getSdaData({
            program: Data.program,
            swapDataAccount: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount;

        const { paymentMint, maker, nftMintMaker } = swapDataData;

        let { mintAta: makerNftAta, instruction: mN } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: maker,
            signer: maker,
        });
        if (mN) {
            console.log("adding );");
            instructions.push(mN);
        }

        let { mintAta: makerTokenAta, instruction: mT } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: maker,
        });
        if (mT) {
            console.log("adding );");
            instructions.push(mT);
        }
        let { mintAta: swapDataAccountTokenAta, instruction: sdaT } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.swapDataAccount,
            signer: maker,
        });
        if (sdaT) {
            console.log("adding sdaT");
            instructions.push(sdaT);
        }

        let { mintAta: swapDataAccountNftAta, instruction: sdaN } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: Data.swapDataAccount,
            signer: maker,
        });

        if (sdaN) {
            console.log("adding sdaN");
            instructions.push(sdaN);
        }

        let { mintAta: takerNftAtaMaker, instruction: tmN } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: maker,
            signer: maker,
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

        let nftMasterEditionMaker = maker;
        let ownerTokenRecordMaker = maker;
        let destinationTokenRecordMaker = maker;
        let authRulesMaker = maker;

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

        const cancelIx = await Data.program.methods
            .cancelSwap()
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                maker,
                makerNftAta,
                makerTokenAta,

                nftMintMaker,
                mintToken: paymentMint,

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
        cancelSwapTx.recentBlockhash = dummyBlockhash;
        cancelSwapTx.feePayer = new PublicKey(maker);
        return {
            tx: new VersionedTransaction(cancelSwapTx.compileMessage()),
            description: DESC.cancelSwap,
            details: { swapDataAccount: Data.swapDataAccount },
            priority: 0,
            blockheight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            status: "pending",
        };
    } catch (error: any) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            swapDataAccount: Data.swapDataAccount,
        };
    }
}
