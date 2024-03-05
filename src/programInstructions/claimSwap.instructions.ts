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
import { BundleTransaction, EnvOpts, ErrorFeedback } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { getCNFTOwner } from "../utils/getCNFTData.function";
import { TOKEN_PROGRAM_ID, createCloseAccountInstruction } from "@solana/spl-token";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
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

export async function createClaimSwapInstructions(
    Data: EnvOpts & {
        swapDataAccount: string;
        // taker: string;
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

    let instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 800000,
        }),
    ];

    try {
        let swapDataData = await getSdaData({
            program: Data.program,
            swapDataAccount: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount;
        let { paymentMint, maker, nftMintMaker, taker, nftMintTaker, acceptedBid } = swapDataData;

        if (!(nftMintTaker && taker && acceptedBid)) {
            throw "SDA doesnt have accepted bids" + JSON.stringify(swapDataData);
        }

        let { mintAta: swapDataAccountNftAta, instruction: sdan } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: Data.swapDataAccount,
            signer: taker,
        });
        if (sdan) {
            instructions.push(sdan);
            console.log("swapDataAccountNftAta", swapDataAccountNftAta);
        }
        let { mintAta: takerNftAtaMaker, instruction: tmn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: taker,
            signer: taker,
        });
        if (tmn) {
            instructions.push(tmn);
            console.log("takerNftAta", takerNftAtaMaker);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer: taker,
        });
        if (tt) {
            instructions.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer: taker,
        });
        if (nst) {
            instructions.push(nst);
            console.log("nsFeeTokenAta", nsFeeTokenAta);
        }

        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: Data.swapDataAccount,
            signer: taker,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: taker,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }

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

        const initIx = await Data.program.methods
            .claimSwap()
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                swapDataAccountNftAta,
                swapDataAccountTokenAta,

                nsFee: NS_FEE,
                nsFeeTokenAta,

                signer: taker,
                taker: taker,
                takerNftAtaMaker,
                takerTokenAta,

                maker,
                // makerNftAta,
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
        instructions.push(initIx);

        instructions.push(
            createCloseAccountInstruction(
                new PublicKey(makerTokenAta),
                new PublicKey(maker),
                new PublicKey(maker)
            ),
            createCloseAccountInstruction(
                new PublicKey(takerTokenAta),
                new PublicKey(taker),
                new PublicKey(taker)
            )
        );
        const tx = new Transaction().add(...instructions);
        tx.feePayer = new PublicKey(taker);
        tx.recentBlockhash = dummyBlockhash;

        return {
            tx: new VersionedTransaction(tx.compileMessage()),
            description: DESC.claimSwap,
            details: { swapDataAccount: Data.swapDataAccount },
            priority: 0,
            status: "pending",
        } as BundleTransaction;
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
            swapDataAccount: Data.swapDataAccount,
        };
    }
}
