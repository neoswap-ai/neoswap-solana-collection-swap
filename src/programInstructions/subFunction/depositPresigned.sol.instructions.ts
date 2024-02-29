import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SwapIdentity } from "../../utils/types";
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
export async function getDepositSolPresignedInstruction(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    mint: PublicKey;
    swapIdentity: SwapIdentity;
    ataList: string[];
}): Promise<{ instruction: TransactionInstruction[]; ataList: string[] }> {
    let instruction: TransactionInstruction[] = [];
    let ataList: string[] = Data.ataList;
    // console.log('mintAta', mintAta);
    const [userPda, userBump] = PublicKey.findProgramAddressSync(
        [Data.user.toBytes()],
        Data.program.programId
    );

    const { mintAta: userAta, instruction: ixCreateuserAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
        mint: Data.mint,
        signer: Data.signer,
    });

    if (ixCreateuserAta && !ataList.includes(userAta.toBase58())) {
        console.log("CreateUserAta Deposit Tx added", userAta);
        instruction.push(ixCreateuserAta);

        ataList.push(userAta.toBase58());
    }

    const { mintAta: swapDataAccountAta, instruction: ixCreateswapDataAccountAta } =
        await findOrCreateAta({
            connection: Data.program.provider.connection,
            owner: Data.swapIdentity.swapDataAccount_publicKey,
            mint: Data.mint,
            signer: Data.signer,
        });

    if (ixCreateswapDataAccountAta && !ataList.includes(swapDataAccountAta.toBase58())) {
        console.log("CreatePdaAta Deposit Tx added", swapDataAccountAta.toBase58());
        instruction.push(ixCreateswapDataAccountAta);

        ataList.push(swapDataAccountAta.toBase58());
    }

    const depositIx = await Data.program.methods
        .depositSolPresigned(Data.swapIdentity.swapDataAccount_seed)
        .accounts({
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
            swapDataAccountWsol: swapDataAccountAta,
            user: Data.user,
            userPda,
            userWsol: userAta,
            signer: Data.signer,
        })
        .instruction();

    instruction.push(depositIx);
    console.log(
        "from: ",
        userAta.toBase58(),
        "\nto: ",
        swapDataAccountAta.toBase58(),
        "\nmint: ",
        NATIVE_MINT.toBase58()
    );
    // console.log('mintAta', mintAta);

    return { instruction, ataList };
}
