import { getSdaData } from "../utils/getSdaData.function";
import { ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";
import { BundleTransaction, ClaimSArg, EnvOpts } from "../utils/types";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { NS_FEE, TOKEN_METADATA_PROGRAM, VERSION } from "../utils/const";
import { findNftDataAndMetadataAccount } from "../utils/findNftDataAndAccounts.function";
import { getCreatorData } from "../utils/creators";
import { DESC } from "../utils/descriptions";
import { checkEnvOpts, getClaimSArgs } from "../utils/check";
import { ix2vTx } from "../utils/vtx";

export async function createPayRoyaltiesInstructions(
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
            program: program,
            swapDataAccount: swapDataAccount,
        });
        if (!swapDataData) throw "no swapData found at " + swapDataAccount;
        let { paymentMint, maker, nftMintMaker, taker, nftMintTaker, acceptedBid } = swapDataData;

        if (!(nftMintTaker && taker && acceptedBid)) {
            throw "SDA doesnt have accepted bids" + JSON.stringify(swapDataData);
        }

        let {
            makerCreator,
            makerCreatorTokenAta,
            takerCreator,
            takerCreatorTokenAta,
            instructions: creatorIxs,
            tokenProgram: makerProg,
        } = await getCreatorData({
            connection,
            nftMintMaker,
            paymentMint,
            taker,
            signer: signer,
            nftMintTaker,
        });

        if (creatorIxs) instructions.push(...creatorIxs);

        let { mintAta: swapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer: signer,
        });
        if (sdat) {
            instructions.push(sdat);
            console.log("swapDataAccountTokenAta", swapDataAccountTokenAta);
        }
        let { mintAta: nsFeeTokenAta, instruction: nst } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: NS_FEE,
            signer: signer,
        });
        if (nst) {
            instructions.push(nst);
            console.log("nsFeeTokenAta", nsFeeTokenAta);
        }

        let {
            mintAta: makerNftAta,
            instruction: mn,
            tokenProgram: takerProg,
        } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: maker,
            signer: signer,
        });
        if (mn) {
            instructions.push(mn);
            console.log("makerNftAta", makerNftAta);
        }

        let { mintAta: makerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: signer,
        });
        if (mt) {
            instructions.push(mt);
            console.log("makerTokenAta", makerTokenAta);
        }

        let { mintAta: takerNftAta, instruction: tn } = await findOrCreateAta({
            connection,
            mint: nftMintTaker,
            owner: taker,
            signer: signer,
        });
        if (tn) {
            instructions.push(tn);
            console.log("takerNftAta", takerNftAta);
        }

        let { mintAta: takerTokenAta, instruction: tt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: taker,
            signer: signer,
        });
        if (tt) {
            instructions.push(tt);
            console.log("takerTokenAta", takerTokenAta);
        }

        let nftMetadataTaker = taker;
        let nftMetadataMaker = taker;

        if (makerProg === TOKEN_PROGRAM_ID.toString())
            nftMetadataMaker = (
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintMaker,
                })
            ).metadataAddress;
        // console.log("nftMetadataMaker", nftMetadataMaker);

        if (takerProg === TOKEN_PROGRAM_ID.toString())
            nftMetadataTaker = (
                await findNftDataAndMetadataAccount({
                    connection,
                    mint: nftMintTaker,
                })
            ).metadataAddress;
        // console.log("nftMetadataTaker", nftMetadataTaker);

        const payRIx = await program.methods
            .payRoyalties()
            .accounts({
                swapDataAccount,
                swapDataAccountTokenAta,

                signer,

                paymentMint,

                nftMetadataTaker,
                nftMetadataMaker,

                metadataProgram: TOKEN_METADATA_PROGRAM,
                tokenProgram: TOKEN_PROGRAM_ID,

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
        instructions.push(payRIx);

        return {
            tx: await ix2vTx(instructions, cEnvOpts, signer),
            description: DESC.payRoyalties,
            details: Data,
            priority: 0,
            status: "pending",
            blockheight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
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
