import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import { SwapIdentity } from "../../utils/types";

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
export async function getDepositNftPresignedInstruction(Data: {
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
    const [userPda] = PublicKey.findProgramAddressSync(
        [Data.user.toBytes()],
        Data.program.programId
    );

    const { mintAta: userMintAta, instruction: ixCreateUserMintAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
        mint: Data.mint,
        signer: Data.signer,
    });

    if (ixCreateUserMintAta && !ataList.includes(userMintAta.toBase58())) {
        console.log("CreateUserAta Deposit Tx added", userMintAta.toBase58());
        instruction.push(ixCreateUserMintAta);
        ataList.push(userMintAta.toBase58());
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
        .depositNftPresigned(Data.swapIdentity.swapDataAccount_seed)
        .accounts({
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey,
            signer: Data.signer,
            user: Data.user,
            userPda,
            delegatedItemAta: userMintAta,
            swapDataAccountAta,
        })
        .instruction();

    instruction.push(depositIx);
    console.log(
        "from: ",
        userMintAta.toBase58(),
        "\nto: ",
        swapDataAccountAta.toBase58(),
        "\nmint: ",
        Data.mint.toBase58()
    );
    // console.log('mintAta', mintAta);

    return { instruction, ataList };
}
