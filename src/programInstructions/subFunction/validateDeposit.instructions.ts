import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { ErrorFeedback, TxWithSigner, TradeStatus } from "../../utils/types";
import { getProgram } from "../../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../../utils/getSwapDataAccountFromPublicKey.function";

export const validateDeposit = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
}): Promise<TxWithSigner[] | undefined> => {
    const program = getProgram({clusterOrUrl:Data.clusterOrUrl});
    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });
    if (!swapData) {
        throw [
            {
                blockchain: "solana",
                status: "error",
                message:
                    "Swap initialization in progress or not initialized. Please try again later.",
            },
        ];
    } else if (swapData.status === TradeStatus.WaitingToClaim) {
        return;
    } else if (swapData.status !== TradeStatus.WaitingToDeposit) {
        throw [
            {
                blockchain: "solana",
                status: "error",
                message: "Swap is't in the adequate status for validating deposit.",
                swapStatus: swapData.status,
            },
        ];
    }
    if (!swapData.initializer.equals(Data.signer))
        throw [
            {
                blockchain: "solana",
                status: "error",
                message: "Signer is not the initializer",
            },
        ];

    const swapIdentity = getSwapIdentityFromData({
        swapData,
    });

    return [
        {
            tx: new Transaction().add(
                await program.methods
                    .validateDeposit(swapIdentity.swapDataAccount_seed)
                    .accounts({
                        swapDataAccount: Data.swapDataAccount,
                        signer: Data.signer,
                    })
                    .instruction()
            ),
        },
    ];
};
