import { BN, Program, web3 } from "@coral-xyz/anchor";
// import { program } from '@project-serum/anchor/dist/cjs/spl/associated-token';
// import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, Signer, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ItemToSell } from "../../utils/types";
// import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
// import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
// import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
// import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
// import { ItemToSell, TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
// import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const getUserPdaAddSellItemIx = async (Data: {
    signer: PublicKey;
    program: Program;
    itemsToSell: ItemToSell[];
}): Promise<TransactionInstruction[]> => {
    const [userPda] = PublicKey.findProgramAddressSync(
        [Data.signer.toBytes()],
        Data.program.programId
    );

    return await Promise.all(
        Data.itemsToSell.map(async (itemToSell) => {
            let itemToDelegate = await getAssociatedTokenAddress(itemToSell.mint, Data.signer);

            return await Data.program.methods
                .userAddItemToSell(itemToSell)
                .accounts({
                    userPda,
                    itemToDelegate,
                    signer: Data.signer,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction();
        })
    );
};

export const getUserPdaRmSellItemIx = async (Data: {
    user?: PublicKey;
    signer: PublicKey;
    program: Program;
    REMOVEitemsToSell: ItemToSell[];
}): Promise<TransactionInstruction[]> => {
    if (!!!Data.user) Data.user = Data.signer;
    const [userPda] = PublicKey.findProgramAddressSync(
        [Data.user.toBytes()],
        Data.program.programId
    );

    return await Promise.all(
        Data.REMOVEitemsToSell.map(async (REMOVEitemToSell) => {
            if (!!!Data.user) Data.user = Data.signer;
            let itemToDelegate = await getAssociatedTokenAddress(
                REMOVEitemToSell.mint,
                Data.user,
                true,
                Data.program.programId
            );

            return await Data.program.methods
                .userRemoveItemToSell(REMOVEitemToSell)
                .accounts({
                    userPda,
                    itemToDelegate,
                    signer: Data.signer,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction();
        })
    );
};
