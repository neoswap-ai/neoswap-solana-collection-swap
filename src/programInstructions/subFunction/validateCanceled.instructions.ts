import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { TxWithSigner, TradeStatus } from "../../utils/types";
import { getProgram } from "../../utils/getProgram.obj";
import { getSwapIdentityFromData } from "../../utils/getSwapIdentityFromData.function";
import { getSwapDataAccountFromPublicKey } from "../../utils/getSwapDataAccountFromPublicKey.function";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../../utils/const";
import { Program } from "@project-serum/anchor";

export const createValidateCanceledInstructions = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
    program?: Program;
}): Promise<TxWithSigner[] | undefined> => {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
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
    } else if (
        !(
            swapData.status === TradeStatus.WaitingToDeposit ||
            swapData.status === TradeStatus.Canceling
        )
    ) {
        throw [
            {
                blockchain: "solana",
                status: "error",
                message: "Swap is't in the adequate status for Validate Cancel.",
                swapStatus: swapData.status,
            },
        ];
    }
    if (!swapData.initializer.equals(Data.signer)) return;

    const swapIdentity = getSwapIdentityFromData({
        swapData,
        clusterOrUrl: Data.clusterOrUrl,
    });

    return [
        {
            tx: new Transaction().add(
                await program.methods
                    .validateCancel(
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
};
