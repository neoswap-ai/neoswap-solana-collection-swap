/* eslint-disable no-throw-literal */
import { hash as hashFunction } from "@coral-xyz/anchor/dist/cjs/utils/sha256";
import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { OrdinalsOffer } from "../../utils/types";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import {
    NATIVE_MINT,
    createSyncNativeInstruction,
    // createAssociatedTokenAccountInstruction,
    // getAssociatedTokenAddress,
    // getAccount,
} from "@solana/spl-token";
export const createDepositOrdinalIx = async (params: {
    program: Program;
    offer: OrdinalsOffer;
}) => {
    if (!params.program.provider.publicKey) throw { message: "user not connected" };

    const [adminPda, adminBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("admin")],
        params.program.programId
    );
    // console.log("adminPda", adminPda.toBase58());

    const offerSeed = Buffer.from(
        hashFunction(
            params.offer.sellerAddress.toString() +
                params.offer.buyerAddress.toString() +
                params.offer.bitcoinAddress +
                params.offer.ordinalsId +
                params.offer.tokenAccepted.toString() +
                params.offer.amount.toString()
        )
    ).subarray(0, 32);
    // console.log("offerSeed", offerSeed.toString());
    const [offerPda, offerBump] = PublicKey.findProgramAddressSync(
        [offerSeed],
        params.program.programId
    );

    // console.log("offerPda", offerPda.toBase58());
    let Ixs: TransactionInstruction[] = [];

    const { mintAta: tokenBuyerAccount, instruction: ownerAtaInstruction } = await findOrCreateAta({
        connection: params.program.provider.connection,
        owner: params.program.provider.publicKey,
        signer: params.program.provider.publicKey,
        mint: params.offer.tokenAccepted,
    });
    if (ownerAtaInstruction) Ixs.push(ownerAtaInstruction);
    const { mintAta: tokenEscrowAccount, instruction: pdaAtaInstruction } = await findOrCreateAta({
        connection: params.program.provider.connection,
        owner: offerPda,
        signer: params.program.provider.publicKey,
        mint: params.offer.tokenAccepted,
    });

    if (pdaAtaInstruction) Ixs.push(pdaAtaInstruction);
    let tokenWrappingIx: TransactionInstruction[] = [];
    if (params.offer.tokenAccepted.equals(NATIVE_MINT)) {
        tokenWrappingIx = [
            SystemProgram.transfer({
                fromPubkey: params.program.provider.publicKey,
                toPubkey: tokenBuyerAccount,
                lamports: params.offer.amount.toNumber(),
            }),
            createSyncNativeInstruction(tokenBuyerAccount),
        ];
    }
    if (tokenWrappingIx.length !== 0) Ixs.push(...tokenWrappingIx);

    console.log("deposit tokens in the escrow");
    const instruction = await params.program.methods
        .depositToken(offerSeed, offerBump, adminBump)
        .accounts({
            offerPda,
            adminPda,
            signer: params.program.provider.publicKey,
            tokenBuyerAccount,
            tokenEscrowAccount,
            systemProgram: web3.SystemProgram.programId,
            splTokenProgram: process.env.REACT_APP_SOLANA_SPL_ATA,
        })
        .instruction();
    Ixs.push(instruction);
    return Ixs;
};
