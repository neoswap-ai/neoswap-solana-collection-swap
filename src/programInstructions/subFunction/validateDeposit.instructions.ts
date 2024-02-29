import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { TxWithSigner, TradeStatus, ErrorFeedback } from "../../utils/types";
import { getProgram } from "../../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../../utils/getSwapDataAccountFromPublicKey.function";
import { Program } from "@coral-xyz/anchor";

export const validateDeposit = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl?: Cluster | string;
    program?: Program;
}): Promise<TxWithSigner[] | undefined> => {
    if (Data.program && Data.clusterOrUrl) {
    } else if (!Data.program && Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!Data.clusterOrUrl && Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }

    const program = Data.program;
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
    // if (!swapData.initializer.equals(Data.signer))
    //     throw [
    //         {
    //             blockchain: "solana",
    //             status: "error",
    //             message: "Signer is not the initializer",
    //         },
    //     ];

    const swapIdentity = getSwapIdentityFromData({
        swapData,
        clusterOrUrl: Data.clusterOrUrl,
    });

    return [
        {
            tx: new Transaction().add(
                await program.methods
                    .depositValidate(swapIdentity.swapDataAccount_seed)
                    .accounts({
                        swapDataAccount: Data.swapDataAccount,
                        signer: Data.signer,
                    })
                    .instruction()
            ),
        },
    ];
};
