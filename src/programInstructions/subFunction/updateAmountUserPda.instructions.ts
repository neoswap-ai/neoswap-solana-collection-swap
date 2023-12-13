import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
    Keypair,
    PublicKey,
    Signer,
    Transaction,
    TransactionInstruction,
    LAMPORTS_PER_SOL,
    SystemProgram,
} from "@solana/web3.js";
import {
    closeAccount,
    closeAccountInstructionData,
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
    createRevokeInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddress,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { neoSwap } from "../..";

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const getUserPdaUpdateAmountIx = async (Data: {
    signer: PublicKey;
    program: Program;
    // amountToTopup: number;
    // mint: PublicKey;
    amountToTopUp: { amount: number; mint: PublicKey };
}): Promise<TransactionInstruction[]> => {
    let userSeed = Data.signer.toBuffer();
    // console.log("userSeed", userSeed);
    // console.log("amountToTopUp", Data.amountToTopUp);

    const [userPda, userBump] = PublicKey.findProgramAddressSync(
        [userSeed],
        Data.program.programId
    );
    console.log("userPda", userPda.toBase58());
    // console.log("userBump", userBump);

    let instructions: TransactionInstruction[] = [];

    if (Data.amountToTopUp.mint.equals(SystemProgram.programId)) {
        // console.log("test", Data.program.methods.userModifyTopUp);

        instructions.push(
            await Data.program.methods
                .userModifyTopUp(
                    new BN(Data.amountToTopUp.amount * LAMPORTS_PER_SOL),
                    userSeed,
                    userBump
                )
                .accounts({
                    userPda,
                    userPdaAta: userPda,
                    signerAta: Data.signer,
                    signer: Data.signer,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction()
        );
        console.log(
            "transfering ",
            Data.amountToTopUp.amount,
            " to user account",
            userPda.toBase58(),
            // " and toping up"
        );
    } else if (Data.amountToTopUp.mint.equals(NATIVE_MINT)) {
        const { mintAta: userWsolAta, instruction: userWsolCreateIx } =
            await neoSwap.UTILS.findOrCreateAta({
                mint: NATIVE_MINT,
                owner: Data.signer,
                signer: Data.signer,
                connection: Data.program.provider.connection,
            });

        if (!!userWsolCreateIx) instructions.push(userWsolCreateIx);

        const { mintAta: userPdaWsolAta, instruction: userPdaWsolCreateIx } =
            await neoSwap.UTILS.findOrCreateAta({
                mint: NATIVE_MINT,
                owner: userPda,
                signer: Data.signer,
                connection: Data.program.provider.connection,
            });

        if (!!userPdaWsolCreateIx) instructions.push(userPdaWsolCreateIx);

        instructions.push(
            SystemProgram.transfer({
                fromPubkey: Data.signer,
                toPubkey: userWsolAta,
                lamports: Data.amountToTopUp.amount * LAMPORTS_PER_SOL,
            }),
            createSyncNativeInstruction(userWsolAta),
            await Data.program.methods
                .userModifyTopUp(
                    new BN(Data.amountToTopUp.amount * LAMPORTS_PER_SOL),
                    userSeed,
                    userBump
                )
                .accounts({
                    userPda,
                    userPdaAta: userPdaWsolAta,
                    signerAta: userWsolAta,
                    signer: Data.signer,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .instruction()
        );
        console.log(
            "transfering ",
            Data.amountToTopUp.amount,
            " to userWsol account",
            userWsolAta.toBase58(),
            " and toping up"
        );
    } else {
        const { mintAta: userAta, instruction: userAtaCreateIx } =
            await neoSwap.UTILS.findOrCreateAta({
                mint: Data.amountToTopUp.mint,
                owner: Data.signer,
                signer: Data.signer,
                connection: Data.program.provider.connection,
            });

        if (!!userAtaCreateIx) instructions.push(userAtaCreateIx);

        const { mintAta: userPdaAta, instruction: userPdaAtaCreateIx } =
            await neoSwap.UTILS.findOrCreateAta({
                mint: Data.amountToTopUp.mint,
                owner: userPda,
                signer: Data.signer,
                connection: Data.program.provider.connection,
            });

        if (!!userPdaAtaCreateIx) instructions.push(userPdaAtaCreateIx);

        instructions.push(
            await Data.program.methods
                .userModifyTopUp(
                    new BN(Data.amountToTopUp.amount * LAMPORTS_PER_SOL),
                    userSeed,
                    userBump
                )
                .accounts({
                    userPda,
                    userPdaAta,
                    signerAta: userAta,
                    signer: Data.signer,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction()
        );
    }

    // console.log(
    //     "Data.amountToTopup * LAMPORTS_PER_SOL",
    //     Data.amountToTopUp.amount * LAMPORTS_PER_SOL
    // );
    if (instructions.length > 0) {
        return instructions;
    } else throw "couldn't find an action to perform";
};
