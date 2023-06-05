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
    const program= getProgram(Data.cluster);
    const swapData = await getSwapDataAccountFromPublicKey({program, swapDataAccount_publicKey:Data.swapDataAccount});
    if (!swapData) {
        return [
            {
                blockchain: "solana",
                type: "error",
                order: 0,
                description:
                    "Swap initialization in progress or not initialized. Please try again later.",
            },
        ];
    } else if (swapData.status === TradeStatus.WaitingToClaim) {
        return [
            {
                blockchain: "solana",
                order: 0,
                type: "error",
                description: "WaitingToClaim state",
            },
        ];
    } else if (swapData.status !== TradeStatus.WaitingToDeposit) {
        return [
            {
                blockchain: "solana",
                type: "error",
                order: 0,
                description: "Swap is't in the adequate status for validating deposit.",
                status: swapData.status,
            },
        ];
    }
    if (!swapData.initializer.equals(Data.signer))
        return [
            {
                blockchain: "solana",
                order: 0,
                type: "error",
                description: "Signer is not the initializer",
            },
        ];

    const swapIdentity = getSwapIdentityFromData({
        swapData,
    });

    if (!swapIdentity)
        return [
            {
                blockchain: "solana",
                type: "error",
                order: 0,
                description:
                    "Data retrieved from the Swap did not allow to build the SwapIdentity.",
            },
        ];
    // console.log("swapIdentity", swapIdentity);

    if (swapData.status === TradeStatus.WaitingToDeposit) {
        return [
            {
                tx: new Transaction().add(
                    await program.methods
                        .validateDeposit(
                            swapIdentity.swapDataAccount_seed,
                            swapIdentity.swapDataAccount_bump
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
                type: "error",
                order: 0,
                description: "Swap is't in the adequate status for validating depositing.",
                status: swapData.status,
            },
        ];
    }
};
