import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { SwapIdentity, SwapInfo, TxWithSigner } from "../utils/types";
import { createClaimSwapInstructions } from "../programInstructions/claimSwap.instructions";
import { validateDeposit } from "../programInstructions/subFunction/validateDeposit.instructions";
import { createValidateClaimedInstructions } from "../programInstructions/subFunction/validateClaimed.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { createModifySwapInstructions } from "../programInstructions/modifySwap.instructions";
import {
    getSwapDataAccountFromPublicKey,
    getSwapInfoFromSwapdataAccountPublickey,
} from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";

export async function createClaimAndCloseSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    program: Program;
    swapInfo?: SwapInfo;
    skipFinalize?: boolean;
}): Promise<TxWithSigner[]> {
    let txToSend: TxWithSigner[] = [];

    let validateDepositTxData = await validateDeposit({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer,
        program: Data.program,
    });
    if (validateDepositTxData) txToSend.push(...validateDepositTxData);

    let claimTxData = await createClaimSwapInstructions({
        swapDataAccount: Data.swapDataAccount,
        signer: Data.signer,
        swapInfo: Data.swapInfo,
        program: Data.program,
    });


    if (claimTxData) txToSend.push(...claimTxData);

    if (!Data.skipFinalize) {
        let validateClaimTxData = await createValidateClaimedInstructions({
            swapDataAccount: Data.swapDataAccount,
            signer: Data.signer,
            program: Data.program,
            // SkipFinalize: Data.skipFinalize,
        });
        if (validateClaimTxData) txToSend.push(...validateClaimTxData);
    }

    return txToSend;
}
