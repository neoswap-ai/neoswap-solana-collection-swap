import { PublicKey } from "@solana/web3.js";
import { SwapInfo, TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { Program } from "@coral-xyz/anchor";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { createModifySwapInstructions } from "../programInstructions/modifySwap.instructions";

export async function createTakeSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    program: Program;
    swapInfo: SwapInfo;
}): Promise<TxWithSigner[]> {
    let txToSend: TxWithSigner[] = [];

    let modifyTxs = await createModifySwapInstructions({
        program: Data.program,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
        swapInfo: Data.swapInfo,
    });
    if (modifyTxs) txToSend.push(...modifyTxs);
    else console.log("no modifyTxs");

    try {
        let depositTxs = await createDepositSwapInstructions({
            signer: Data.signer,
            swapDataAccount: Data.swapDataAccount,
            user: Data.signer,
            program: Data.program,
            swapInfo: Data.swapInfo,
        });
        if (depositTxs) txToSend.push(...depositTxs);
    } catch (error: any) {
        if (
            !(
                error.message === "Status of the swap isn't in a depositing state." ||
                error.message === "You have no items to escrow in this swap" ||
                error.message === "You have already escrowed your items in this swap"
            )
        )
            throw error;
        console.log(`error skipped : ${error}`);
        console.log(`String(error) skipped : ${String(error)}`);
        console.log(`error.message skipped : ${error.message}`);
    }

    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer,
        program: Data.program,
    });
    if (validateDepositTxData) txToSend.push(...validateDepositTxData);
    else console.log("no validateDepositTxData");

    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer,
        swapInfo: Data.swapInfo,
        program: Data.program,
    });

    if (claimTxData) txToSend.push(...claimTxData);
    else console.log("no claimTxData");

    let validateClaimTxData = await createValidateClaimedInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer,
        program: Data.program,
    });
    if (validateClaimTxData) txToSend.push(...validateClaimTxData);
    else console.log("no validateClaimTxData");

    return txToSend;
}
