import { TransactionInstruction } from "@solana/web3.js";
import { checkEnvOpts } from "../utils/check";
import { bidToscBid } from "../utils/typeSwap";
import { BundleTransaction, EnvOpts, UpdateArgs } from "../utils/types";
import { DESC } from "../utils/descriptions";
import { ix2vTx } from "../utils/vtx";
import { getSdaData } from "../utils/getSdaData.function";
import { findOrCreateAta } from "../utils/findOrCreateAta.function";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function createAddBidIx(
    Data: EnvOpts & UpdateArgs
): Promise<{ bidIxs: TransactionInstruction[]; ataIxs: TransactionInstruction[] }> {
    let { bids, swapDataAccount, maker, paymentMint, makerTokenAta, swapDataAccountTokenAta } =
        Data;
    let cEnvOpts = checkEnvOpts(Data);
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

export async function createAddBidBt(Data: EnvOpts & UpdateArgs): Promise<BundleTransaction> {
    let bidIxs = await createAddBidIx(Data);
    let ixs = [];
    if (bidIxs.ataIxs) ixs.push(...bidIxs.ataIxs);
    ixs.push(...bidIxs.bidIxs);
    return {
        description: DESC.addBid,
        tx: await ix2vTx(ixs, checkEnvOpts(Data), Data.maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}

export async function createRmBidIx(Data: EnvOpts & UpdateArgs): Promise<TransactionInstruction[]> {
    let { bids, swapDataAccount, maker } = Data;
    let cEnvOpts = checkEnvOpts(Data);
    let { program } = cEnvOpts;
    return await Promise.all(
        bids.map(
            async (bid) =>
                await program.methods
                    .removeBid(bidToscBid(bid))
                    .accounts({
                        swapDataAccount,
                        maker,
                    })
                    .instruction()
        )
    );
}

export async function createRmBidBt(Data: EnvOpts & UpdateArgs): Promise<BundleTransaction> {
    return {
        description: DESC.removeBid,
        tx: await ix2vTx(await createRmBidIx(Data), checkEnvOpts(Data), Data.maker),
        details: Data,
        priority: 0,
        status: "pending",
    };
}
