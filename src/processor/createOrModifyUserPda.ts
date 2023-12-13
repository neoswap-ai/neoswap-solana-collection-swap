import { Cluster, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { sendBundledTransactions } from "../utils/sendBundledTransactions.function";
import { createDepositSwapInstructions } from "../programInstructions/depositSwap.instructions";
import { getProgram } from "../utils/getProgram.obj";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createOrModifyUserPdaInstructions } from "../programInstructions/createOrModifyUserPda.instructions";
import { ItemToBuy, ItemToSell } from "../utils/types";

export async function createOrModifyUserPda(Data: {
    signer: Keypair;
    user?: PublicKey;
    amountToTopUp?: { amount: number; mint: PublicKey };
    itemsToSell?: ItemToSell[];
    itemsToBuy?: ItemToBuy[];
    REMOVEitemsToSell?: ItemToSell[];
    REMOVEitemsToBuy?: ItemToBuy[];
    clusterOrUrl: Cluster | string;
    simulation?: boolean;
    skipConfirmation?: boolean;
}): Promise<string[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl, signer: Data.signer });
    let depositSwapData = await createOrModifyUserPdaInstructions({
        signer: Data.signer.publicKey,
        user: Data.user ? Data.user : undefined,
        amountToTopUp: Data.amountToTopUp,
        itemsToBuy: Data.itemsToBuy,
        itemsToSell: Data.itemsToSell,
        REMOVEitemsToBuy: Data.REMOVEitemsToBuy,
        REMOVEitemsToSell: Data.REMOVEitemsToSell,
        clusterOrUrl: Data.clusterOrUrl,
        program,
    });
    if (!!!depositSwapData.instructions) throw "nothing to change";

    let txsWithoutSigners = depositSwapData.instructions.map((ixs) => {
        return {
            tx: new Transaction().add(...ixs),
        };
    });
    const transactionHashs = await sendBundledTransactions({
        provider: program.provider as AnchorProvider,
        txsWithoutSigners,
        signer: Data.signer,
        clusterOrUrl: Data.clusterOrUrl,
        simulation: Data.simulation,
        skipConfirmation: Data.skipConfirmation,
    });

    return transactionHashs;
}
