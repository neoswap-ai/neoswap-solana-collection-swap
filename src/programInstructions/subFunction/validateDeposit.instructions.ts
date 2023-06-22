import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { ErrorFeedback, TxWithSigner, TradeStatus } from "../../utils/types";
import { getProgram } from "../../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../../utils/getSwapDataAccountFromPublicKey.function";

export const validateDeposit = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner | ErrorFeedback | undefined> => {
    const program = getProgram(Data.cluster);
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });
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
    } else if (swapData.status === TradeStatus.WaitingToClaim) {
        return [
            {
                blockchain: "solana",
                order: 0,
                status: "error",
                message: "WaitingToClaim state",
            },
        ];
    } else if (swapData.status !== TradeStatus.WaitingToDeposit) {
        return [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message: "Swap is't in the adequate status for validating deposit.",
                swapStatus: swapData.status,
            },
        ];
    }
    if (!swapData.initializer.equals(Data.signer))
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

    if (swapData.status === TradeStatus.WaitingToDeposit) {
        return [
            {
                tx: new Transaction().add(
                    await program.methods
                        .validateDeposit(
                            swapIdentity.swapDataAccount_seed
                            // swapIdentity.swapDataAccount_bump
                        )
                        .accounts({
                            swapDataAccount: Data.swapDataAccount,
                            signer: Data.signer,
                        })
                        .instruction()
                ),
            },
        ];
    } else if (swapData.status === TradeStatus.WaitingToClaim) {
        return undefined;
    } else {
        return [
            {
                blockchain: "solana",
                status: "error",
                order: 0,
                message: "Swap is't in the adequate status for validating depositing.",
                swapStatus: swapData.status,
            },
        ];
    }
};
