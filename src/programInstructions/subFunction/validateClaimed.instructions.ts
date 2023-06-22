import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ErrorFeedback, TxWithSigner, TradeStatus } from "../../utils/types";
import { getProgram } from "../../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../../utils/getSwapDataAccountFromPublicKey.function";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../../utils/const";

export const createValidateClaimedInstructions = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner | ErrorFeedback> => {
    const program = getProgram(Data.cluster);
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });
    console.log("swapData", swapData);

    if (!swapData) {
        return [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message:
                    "Swap initialization in progress or not initialized. Please try again later.",
            },
        ];
    } else if (
        !(
            swapData.status === TradeStatus.WaitingToDeposit ||
            swapData.status === TradeStatus.WaitingToClaim
        )
    ) {
        return [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message: "Swap is't in the adequate status for Validating Claiming.",
                swapStatus: swapData.status,
            },
        ];
    } else if (!swapData.initializer.equals(Data.signer))
        return [
            {
                blockchain: "solana",
                order: 0,
                status: "error",
                message: "Signer is not the initializer",
            },
        ];
    const swapIdentity = getSwapIdentityFromData({
        swapData,
    });

    if (!swapIdentity)
        return [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message: "Data retrieved from the Swap did not allow to build the SwapIdentity.",
            },
        ];
    // console.log("swapIdentity", swapIdentity);

    if (
        swapData.status === TradeStatus.WaitingToDeposit ||
        swapData.status === TradeStatus.WaitingToClaim
    ) {
        return [
            {
                tx: new Transaction().add(
                    await program.methods
                        .validateClaimed(
                            swapIdentity.swapDataAccount_seed
                            // swapIdentity.swapDataAccount_bump
                        )
                        .accounts({
                            systemProgram: SystemProgram.programId,
                            splTokenProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                            swapDataAccount: Data.swapDataAccount,
                            signer: Data.signer,
                        })
                        .instruction()
                ),
            },
        ];
    } else {
        return [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message: "Swap is't in the adequate status for validating claim.",
                swapStatus: swapData.status,
            },
        ];
    }
};
