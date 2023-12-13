import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {  OptionToSell, SwapIdentity } from "../../utils/types";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";

/**
 * @notice creates instruction for depositing a NFT Item
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} signer user that sends NFT
 * @param {PublicKey} mint mint addtress of the NFT to transfer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @param {Array<PublicKey>} ataList list of ATA created until now
 * @return {TransactionInstruction[]}instruction => list of instruction created for depositing NFT
 * @return {PublicKey[]}mintAta => updated list of ATA created until now
 */
export async function getRemoveSellFromUserPdaInstruction(Data: {
    program: Program;
    itemToRemove: OptionToSell;
    signer: PublicKey;
    // mint: PublicKey;
    // swapIdentity: SwapIdentity;
    // ataList: string[];
}): Promise<TransactionInstruction> {
    const [userPda, userBump] = PublicKey.findProgramAddressSync(
        [Data.signer.toBytes()],
        Data.program.programId
    );
    return await Data.program.methods
        .userRemoveItemToSell(Data.itemToRemove)
        .accounts({
            tokenProgram: TOKEN_PROGRAM_ID,
            userPda,
            signer: Data.signer,
        })
        .instruction();

    // console.log('mintAta', mintAta);
}
