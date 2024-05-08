import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { checkEnvOpts } from "../utils/check";
import { bidToscBid } from "../utils/typeSwap";
import { BundleTransaction, EnvOpts, RmBidArgs, UpdateSArgs } from "../utils/types";
import { DESC } from "../utils/descriptions";
import { ix2vTx } from "../utils/vtx";
import { getSdaData } from "../utils/getSdaData.function";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addWSol } from "../utils/wsol";

export async function createAddBidIx(
    Data: EnvOpts & UpdateSArgs
): Promise<{ bidIxs: TransactionInstruction[]; ataIxs: TransactionInstruction[] }> {
    let { bids, swapDataAccount, maker, paymentMint, makerTokenAta, swapDataAccountTokenAta } =
        Data;
    let cEnvOpts = await checkEnvOpts(Data);
    let { program, connection, clusterOrUrl } = cEnvOpts;
    let ataIxs: TransactionInstruction[] = [];

    bids = bids.sort((v1, v2) => {
        let bidAmount1 = v1.makerNeoswapFee + v1.makerRoyalties + Math.max(-v1.amount, 0);
        let bidAmount2 = v2.makerNeoswapFee + v2.makerRoyalties + Math.max(-v2.amount, 0);

        return bidAmount1 - bidAmount2;
    });

    // let paymentMint: string;
    if (!(paymentMint && makerTokenAta && swapDataAccountTokenAta)) {
        let sdaData = await getSdaData({ clusterOrUrl, swapDataAccount });
        if (sdaData?.paymentMint) paymentMint = sdaData.paymentMint;
        else throw "paymentMint not found";

        let { mintAta: pmakerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: maker,
        });
        if (mt) ataIxs.push(mt);
        else console.log("pmakerTokenAta", pmakerTokenAta);
        makerTokenAta = pmakerTokenAta;
        let { mintAta: pswapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer: maker,
        });
        if (sdat) ataIxs.push(sdat);
        else console.log("pswapDataAccountTokenAta", pswapDataAccountTokenAta);
        swapDataAccountTokenAta = pswapDataAccountTokenAta;
    }
    if (paymentMint == WRAPPED_SOL_MINT.toString()) {
        let paymentSdaTokens = Number(
            (await connection.getTokenAccountBalance(new PublicKey(swapDataAccountTokenAta))).value
                .amount
        );

        let highestBid = 0;
        bids.forEach((bid) => {
            let bidAmount = bid.makerNeoswapFee + bid.makerRoyalties + Math.max(-bid.amount, 0);
            console.log("Math.max(-bid.amount, 0)", Math.max(-bid.amount, 0));

            if (bidAmount > highestBid) {
                highestBid = bidAmount;
            }
        });
        if (highestBid > paymentSdaTokens) {
            let amountToWrap = highestBid - paymentSdaTokens;
            console.log("amountToWrap", amountToWrap);
            ataIxs.push(...addWSol(maker, makerTokenAta, amountToWrap));
            
        }
    }
    return {
        bidIxs: await Promise.all(
            bids.map(
                async (bid) =>
                    await program.methods
                        .addBid(bidToscBid(bid))
                        .accounts({
                            swapDataAccount,
                            maker,
                            swapDataAccountTokenAta,
                            makerTokenAta,
                            tokenProgram: TOKEN_PROGRAM_ID,
                        })
                        .instruction()
            )
        ),
        ataIxs,
    };
}

export async function createAddBidBt(Data: EnvOpts & UpdateSArgs): Promise<BundleTransaction> {
    let bidIxs = await createAddBidIx(Data);
    let ixs = [];
    if (bidIxs.ataIxs) ixs.push(...bidIxs.ataIxs);
    ixs.push(...bidIxs.bidIxs);
    return {
        description: DESC.addBid,
        tx: await ix2vTx(ixs, await checkEnvOpts(Data), Data.maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}

export async function createRmBidIx(Data: EnvOpts & RmBidArgs): Promise<TransactionInstruction[]> {
    let { rmBids, swapDataAccount, maker, paymentMint, makerTokenAta, swapDataAccountTokenAta } =
        Data;
    let cEnvOpts = await checkEnvOpts(Data);
    let { program, connection, clusterOrUrl } = cEnvOpts;
    let ataIxs: TransactionInstruction[] = [];
    // let paymentMint: string;
    if (!(paymentMint && makerTokenAta && swapDataAccountTokenAta)) {
        let sdaData = await getSdaData({ clusterOrUrl, swapDataAccount });
        if (sdaData?.paymentMint) paymentMint = sdaData.paymentMint;
        else throw "paymentMint not found";

        let { mintAta: pmakerTokenAta, instruction: mt } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: maker,
            signer: maker,
        });
        if (mt) ataIxs.push(mt);
        else console.log("pmakerTokenAta", pmakerTokenAta);
        makerTokenAta = pmakerTokenAta;
        let { mintAta: pswapDataAccountTokenAta, instruction: sdat } = await findOrCreateAta({
            connection,
            mint: paymentMint,
            owner: swapDataAccount,
            signer: maker,
        });
        if (sdat) ataIxs.push(sdat);
        else console.log("pswapDataAccountTokenAta", pswapDataAccountTokenAta);
        swapDataAccountTokenAta = pswapDataAccountTokenAta;
    }
    return await Promise.all(
        rmBids.map(
            async (bid) =>
                await program.methods
                    .removeBid(bidToscBid(bid))
                    .accounts({
                        swapDataAccount,
                        maker,
                        swapDataAccountTokenAta,
                        makerTokenAta,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    })
                    .instruction()
        )
    );
}

export async function createRmBidBt(Data: EnvOpts & RmBidArgs): Promise<BundleTransaction> {
    return {
        description: DESC.rmBid,
        tx: await ix2vTx(await createRmBidIx(Data), await checkEnvOpts(Data), Data.maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}
