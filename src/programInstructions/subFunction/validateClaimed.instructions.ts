import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ErrorFeedback, TxWithSigner, TradeStatus } from "../../utils/types";
import { getProgram } from "../../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../../utils/getSwapDataAccountFromPublicKey.function";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../../utils/const";

export const createValidateClaimedInstructions = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
}): Promise<TxWithSigner[] | undefined> => {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });
    console.log("swapData", swapData);

    if (!swapData) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (
        !(
            swapData.status === TradeStatus.WaitingToDeposit ||
            swapData.status === TradeStatus.WaitingToClaim
        )
    ) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap is't in the adequate status for Validating Claiming.",
            swapStatus: swapData.status,
        } as ErrorFeedback;
    } else if (!swapData.initializer.equals(Data.signer)) return undefined;
    // throw {
    //     blockchain: "solana",
    //     status: "error",
    //     message: "Signer is not the initializer",
    // } as ErrorFeedback;
    const swapIdentity = getSwapIdentityFromData({
        swapData,
    });

    return [
        {
            tx: new Transaction().add(
                await program.methods
                    .validateClaimed(swapIdentity.swapDataAccount_seed)
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
};
