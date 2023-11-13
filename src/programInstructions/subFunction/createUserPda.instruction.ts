import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../../utils/const";

/**
 * @notice creates instruction for creating the user pda (UDA) to hold prpesigning data.
 * @param {PublicKey} signer fee payer
 * @param {PublicKey} user user we want to create UDA for
 * @param {Program} program program linked to NeoSwap
 */
export const getUserPdaCreateIx = async (Data: {
    signer: PublicKey;
    user?: PublicKey;
    program: Program;
}): Promise<{
    instruction?: TransactionInstruction;
    userPda: PublicKey;
}> => {
    if (!!!Data.user) Data.user = Data.signer;
    // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');
    const [userPda] = PublicKey.findProgramAddressSync(
        [Data.user.toBytes()],
        Data.program.programId
    );
    const balance = await Data.program.provider.connection.getBalance(userPda);
    if (balance === 0) {
        const instruction = await Data.program.methods
            .userPdaCreate()
            .accounts({
                userPda,
                user: Data.user,
                signer: Data.signer,
                systemProgram: web3.SystemProgram.programId,
                splTokenProgram: SOLANA_SPL_ATA_PROGRAM_ID,
            })
            .instruction();

        return { instruction, userPda };
    } else return { userPda };
};
