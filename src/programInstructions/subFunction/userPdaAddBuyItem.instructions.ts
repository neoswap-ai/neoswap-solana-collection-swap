import { Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { OptionToBuy } from "../../utils/types";

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const getUserPdaBuyItemIx = async (Data: {
    signer: PublicKey;
    program: Program;
    itemsToBuy: OptionToBuy[];
    is_removeItem: boolean;
}): Promise<TransactionInstruction[]> => {
    const [userPda] = PublicKey.findProgramAddressSync(
        [Data.signer.toBytes()],
        Data.program.programId
    );

    return await Promise.all(
        Data.itemsToBuy.map(async (itemToBuy) => {
            return await Data.program.methods
                .userModifyNftBuy(itemToBuy, Data.is_removeItem)
                .accounts({
                    userPda,
                    signer: Data.signer,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction();
        })
    );
};
