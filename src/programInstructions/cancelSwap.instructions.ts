import { getSdaData } from "../utils/getSdaData.function";
import {
    ComputeBudgetProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import { EnvOpts, BundleTransaction, ClaimSArg } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
    VERSION,
} from "../utils/const";
import {
    findNftDataAndMetadataAccount,
    findPnftAccounts,
    getCoreCollection,
    whichStandard,
} from "../utils/findNftDataAndAccounts.function";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { DESC } from "../utils/descriptions";
import { checkEnvOpts, getClaimSArgs } from "../utils/check";
import { ix2vTx } from "../utils/vtx";
import { closeWSol } from "../utils/wsol";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";

export async function createCancelSwapInstructions(
    Data: EnvOpts & ClaimSArg
): Promise<BundleTransaction> {
    console.log(VERSION);
    let cEnvOpts = await checkEnvOpts(Data);
    let ClaimSArgs = getClaimSArgs(Data);
    let { program, connection } = cEnvOpts;
    let { signer, swapDataAccount } = ClaimSArgs;

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];
    try {
        let swapDataData = await getSdaData({
            program,
            swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;

        const { paymentMint, maker, nftMintMaker } = swapDataData;

        let { mintAta: swapDataAccountTokenAta, instruction: sdaT } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer,
        });
        if (sdaT) {
            console.log("adding swapDataAccountTokenAta", swapDataAccountTokenAta.toString());
            instructions.push(sdaT);
        }
        let { mintAta: makerTokenAta, instruction: mT } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer,
        });
        if (mT) {
            console.log("adding makerTokenAta", makerTokenAta.toString());
            instructions.push(mT);
        }

        let tknStd = await whichStandard({ connection, mint: nftMintMaker });
        console.log(" tknD", tknStd);

        if (tknStd === "core") {
            let collection = await getCoreCollection({ connection, mint: nftMintMaker });
            let cancelIxs = await program.methods
                .cancelSwapCore()
                .accountsStrict({
                    collection,
                    coreProgram: MPL_CORE_PROGRAM_ID,
                    maker,
                    makerTokenAta,
                    nftMintMaker,
                    paymentMint,
                    signer,
                    swapDataAccount,
                    swapDataAccountTokenAta,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction();
            instructions.push(cancelIxs);
        } else {
            let { mintAta: makerNftAta, instruction: mN } = await findOrCreateAta({
                connection,
                mint: nftMintMaker,
                owner: maker,
                signer,
            });
            if (mN) {
                console.log("adding makerNftAta", makerNftAta.toString());
                instructions.push(mN);
            }

            let { mintAta: swapDataAccountNftAta, instruction: sdaN } = await findOrCreateAta({
                connection,
                mint: nftMintMaker,
                owner: swapDataAccount,
                signer,
            });

            if (sdaN) {
                console.log("adding swapDataAccountNftAta", swapDataAccountNftAta.toString());
                instructions.push(sdaN);
            }

            if (tknStd == "native") {
                let nftMasterEditionMaker = signer;
                let ownerTokenRecordMaker = signer;
                let destinationTokenRecordMaker = signer;
                let authRulesMaker = signer;

                const { metadataAddress: nftMetadataMaker, tokenStandard: tokenStandardMaker } =
                    await findNftDataAndMetadataAccount({
                        connection,
                        mint: nftMintMaker,
                    });
                console.log("nftMetadataMaker", nftMetadataMaker);

                if (tokenStandardMaker == TokenStandard.ProgrammableNonFungible) {
                    ({
                        authRules: authRulesMaker,
                        destinationTokenRecord: destinationTokenRecordMaker,
                        masterEdition: nftMasterEditionMaker,
                        ownerTokenRecord: ownerTokenRecordMaker,
                    } = await findPnftAccounts({
                        connection,
                        ownerAta: swapDataAccountNftAta,
                        mint: nftMintMaker,
                        destinationAta: makerNftAta,
                    }));
                }

                const cancelIx = await program.methods
                    .cancelSwap()
                    .accountsStrict({
                        signer,

                        swapDataAccount,
                        swapDataAccountNftAta,
                        swapDataAccountTokenAta,

                        maker,
                        makerNftAta,
                        makerTokenAta,

                        nftMintMaker,
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
                        ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                        authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    })
                    .instruction();
                console.log("adding native cancelIx");
                instructions.push(cancelIx);
            } else if (tknStd == "hybrid") {
                const cancelIx = await program.methods
                    .cancelSwap22()
                    .accountsStrict({
                        signer,

                        swapDataAccount,
                        swapDataAccountNftAta,
                        swapDataAccountTokenAta,

                        maker,
                        makerNftAta,
                        makerTokenAta,

                        nftMintMaker,
                        paymentMint,

                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        tokenProgram22: TOKEN_2022_PROGRAM_ID,
                        ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    })
                    .instruction();
                console.log("adding hybrid cancelIx");
                instructions.push(cancelIx);
            } else throw "unsupported token standard";
        }

        if (swapDataData.paymentMint === WRAPPED_SOL_MINT.toString() && signer == maker)
            instructions.push(closeWSol(maker, maker, makerTokenAta));

        return {
            tx: await ix2vTx(instructions, cEnvOpts, signer),
            description: DESC.cancelSwap,
            details: Data,
            priority: 0,
            blockheight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            status: "pending",
        } as BundleTransaction;
    } catch (error: any) {
        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            swapDataAccount,
        };
    }
}
