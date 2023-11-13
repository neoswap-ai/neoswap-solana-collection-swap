import { getProgram } from "../utils/getProgram.obj";
import { Cluster, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { ItemToBuy, ItemToSell } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { getUserPdaCreateIx } from "./subFunction/createUserPda.instruction";
import { getUserPdaUpdateAmountIx } from "./subFunction/updateAmountUserPda.instructions";
import {
    getUserPdaAddSellItemIx,
    getUserPdaRmSellItemIx,
} from "./subFunction/userPdaAddSellItem.instructions";
import {
    getUserPdaAddBuyItemIx,
    getUserPdaRmBuyItemIx,
} from "./subFunction/userPdaAddBuyItem.instructions";

export async function createOrModifyUserPdaInstructions(Data: {
    signer: PublicKey;
    user?: PublicKey;
    clusterOrUrl: Cluster | string;
    amountToTopUp?: number;
    itemsToBuy?: ItemToBuy[];
    itemsToSell?: ItemToSell[];
    REMOVEitemsToBuy?: ItemToBuy[];
    REMOVEitemsToSell?: ItemToSell[];
    program?: Program;
}): Promise<{ instructions?: TransactionInstruction[][]; userPda: PublicKey }> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
    let instructions: TransactionInstruction[][] = [];
    try {
        const createUserPdaData = await getUserPdaCreateIx({
            program,
            signer: Data.signer,
            user: Data.user,
        });
        if (!!createUserPdaData.instruction) instructions.push([createUserPdaData.instruction]);
        if (Data.user?.equals(Data.signer)) {
            if (Data.amountToTopUp) {
                const addAmountToTopUpData = await getUserPdaUpdateAmountIx({
                    amountToTopup: Data.amountToTopUp,
                    program,
                    signer: Data.signer,
                    user: Data.user,
                });
                if (!!addAmountToTopUpData) instructions.push(addAmountToTopUpData);
            }
            if (!!Data.REMOVEitemsToSell && Data.REMOVEitemsToSell.length > 0) {
                const addSellUserPdaIxs = await getUserPdaRmSellItemIx({
                    REMOVEitemsToSell: Data.REMOVEitemsToSell,
                    program,
                    signer: Data.signer,
                    user: Data.user,
                });
                if (!!addSellUserPdaIxs) instructions.push(addSellUserPdaIxs);
            }
            if (!!Data.itemsToSell && Data.itemsToSell.length > 0) {
                const addSellUserPdaIxs = await getUserPdaAddSellItemIx({
                    itemsToSell: Data.itemsToSell,
                    program,
                    signer: Data.signer,
                });
                if (!!addSellUserPdaIxs) instructions.push(addSellUserPdaIxs);
            }
            if (!!Data.REMOVEitemsToBuy && Data.REMOVEitemsToBuy.length > 0) {
                const addBuyUserPdaIxs = await getUserPdaRmBuyItemIx({
                    REMOVEitemsToBuy: Data.REMOVEitemsToBuy,
                    program,
                    signer: Data.signer,
                    user: Data.user,
                });
                if (!!addBuyUserPdaIxs) instructions.push(addBuyUserPdaIxs);
            }
            if (!!Data.itemsToBuy && Data.itemsToBuy.length > 0) {
                const addBuyUserPdaIxs = await getUserPdaAddBuyItemIx({
                    itemsToBuy: Data.itemsToBuy,
                    program,
                    signer: Data.signer,
                });
                if (!!addBuyUserPdaIxs) instructions.push(addBuyUserPdaIxs);
            }
        } else {
            console.log("user is not signer");
        }
        if (instructions.length > 0) {
            return { instructions, userPda: createUserPdaData.userPda };
        } else return { userPda: createUserPdaData.userPda };
    } catch (error: any) {
        console.log("error init", error);
        throw error;
    }
}
