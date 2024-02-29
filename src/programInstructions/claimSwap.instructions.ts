import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
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

export async function createClaimSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    taker: PublicKey;
    // nftMintTaker: PublicKey;
    // bid: Bid;
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
        let swapDataData = await getSwapDataAccountFromPublicKey({
            program: Data.program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + Data.swapDataAccount.toBase58();
        const { paymentMint, maker, nftMintMaker } = swapDataData;

        let { mintAta: takerMakerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: Data.taker,
            signer: Data.taker,
        });
        if (tn) {
            instructions.push(tn);
            console.log("takerNftAta", takerMakerNftAta.toBase58());
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
            mint: nftMintMaker,
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

        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer: Data.taker,
        });
        if (nst) {
            instructions.push(nst);
            console.log("nsFeeTokenAta", nsFeeTokenAta.toBase58());
        }

        let { mintAta: swapDataAccountMakerNftAta, instruction: sdan } = await findOrCreateAta({
            connection,
            mint: nftMintMaker,
            owner: Data.swapDataAccount,
            signer: Data.taker,
        });
        if (sdan) {
            instructions.push(sdan);
            console.log("swapDataAccountNftAta", swapDataAccountMakerNftAta.toBase58());
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
        const { metadataAddress: makerNftMetadata, tokenStandard } =
            await findNftDataAndMetadataAccount({
                connection: Data.program.provider.connection,
                mint: nftMintMaker,
            });

        console.log("makerNftMetadata", makerNftMetadata.toBase58());

        let makerNftMasterEdition = Data.taker;
        let ownerTokenRecord = Data.taker;
        let destinationTokenRecord = Data.taker;
        let authRules = Data.taker;

        if (tokenStandard == TokenStandard.ProgrammableNonFungible) {
            const makerNftMasterEditionF = findNftMasterEdition({
                mint: nftMintMaker,
            });

            const ownerTokenRecordF = findUserTokenRecord({
                mint: nftMintMaker,
                userMintAta: makerNftAta,
            });

            const destinationTokenRecordF = findUserTokenRecord({
                mint: nftMintMaker,
                userMintAta: makerNftAta,
            });

            const authRulesF = await findRuleSet({
                connection,
                mint: nftMintMaker,
            });
            makerNftMasterEdition = makerNftMasterEditionF;
            ownerTokenRecord = ownerTokenRecordF;
            destinationTokenRecord = destinationTokenRecordF;
            authRules = authRulesF;
        }

        const initIx = await Data.program.methods
            .claimSwap()
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                swapDataAccountMakerNftAta,
                swapDataAccountTokenAta,

                NS_FEE,
                nsFeeTokenAta,

                taker: Data.taker,
                takerMakerNftAta,
                takerTokenAta,

                maker,
                // makerNftAta,
                makerTokenAta,

                nftMintMaker: nftMintMaker,
                mintToken: paymentMint,

                makerNftMetadata,
                makerNftMasterEdition,
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
