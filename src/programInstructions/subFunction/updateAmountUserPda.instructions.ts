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
    amountToTopup: number;
    mint: PublicKey;
}): Promise<TransactionInstruction[]> => {
    let userSeed = [Data.signer.toBytes()];
    const [userPda, userBump] = PublicKey.findProgramAddressSync(userSeed, Data.program.programId);

    let instructions: TransactionInstruction[] = [];

    if (Data.mint.equals(SystemProgram.programId)) {
        const addUserItemToAddIx = await Data.program.methods
            .userModifyTopUp(new BN(Data.amountToTopup * LAMPORTS_PER_SOL), userSeed, userBump)
            .accounts({
                userPda,
                signerAta: Data.signer,
                signer: Data.signer,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        instructions.push(addUserItemToAddIx);
    } else if (Data.mint.equals(NATIVE_MINT)) {
    } else {
    }

    const userAta = await getAssociatedTokenAddress(NATIVE_MINT, Data.signer);

    // console.log('userAta', userAta.toBase58());
    let balance: (number | null) | undefined = undefined;
    try {
        balance = (await Data.program.provider.connection.getTokenAccountBalance(userAta)).value
            .uiAmount;
    } catch (error) {
        if (!String(error).includes("could not find account")) {
            throw "error";
        }
        console.log("could not find account", error);
    }
    console.log("balance", balance);

    // console.log('Balance', balance);
    // console.log('Data.amountToTopup', Data.amountToTopup);

    if (balance === undefined || balance === null) {
        instructions.push(
            createAssociatedTokenAccountInstruction(Data.signer, userAta, Data.signer, NATIVE_MINT),
            SystemProgram.transfer({
                fromPubkey: Data.signer,
                toPubkey: userAta,
                lamports: Data.amountToTopup * LAMPORTS_PER_SOL,
            }),
            createSyncNativeInstruction(userAta)
        );
        // userTransaction.push({ tx: new Transaction().add(...instructions) });
        console.log("creating userWsol account", userAta.toBase58());
    } else if (balance < Data.amountToTopup) {
        instructions.push(
            SystemProgram.transfer({
                fromPubkey: Data.signer,
                toPubkey: userAta,
                lamports: Math.ceil((Data.amountToTopup - balance) * LAMPORTS_PER_SOL),
            }),
            createSyncNativeInstruction(userAta)
        );
        // userTransaction.push({ tx: new Transaction().add(...instructions) });
        console.log(
            "transfering ",
            Math.ceil((Data.amountToTopup - balance) * LAMPORTS_PER_SOL) / LAMPORTS_PER_SOL,
            " to userWsol account",
            userAta.toBase58()
        );
    } else if (Data.amountToTopup === 0) {
        console.log("amount = 0");
        return [
            await Data.program.methods
                .userModifyTopUp(new BN(Data.amountToTopup * LAMPORTS_PER_SOL), userSeed, userBump)
                .accounts({
                    userPda,
                    userAta,
                    signer: Data.signer,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction(),
        ];
    }

    // console.log('userBump', userBump);
    console.log("Data.amountToTopup * LAMPORTS_PER_SOL", Data.amountToTopup * LAMPORTS_PER_SOL);

    instructions.push(
        createRevokeInstruction(
            userAta, // token account
            Data.signer // owner of token account
        )
    );

    const addUserItemToAddIx = await Data.program.methods
        .userModifyTopUp(new BN(Data.amountToTopup * LAMPORTS_PER_SOL), userSeed, userBump)
        .accounts({
            userPda,
            userAta,
            signer: Data.signer,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
    instructions.push(addUserItemToAddIx);
    // userTransaction.push({ tx: new Transaction().add(addUserItemToAddIx) });
    // userTransaction = appendTransactionToArray({
    //     mainArray: userTransaction,
    //     itemToAdd: [addUserItemToAddIx],
    // });

    // const userTransaction = await convertAllTransaction(userTransaction);

    return instructions;
};
