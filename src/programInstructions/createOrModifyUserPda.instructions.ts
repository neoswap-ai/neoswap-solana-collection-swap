import { getProgram } from "../utils/getProgram.obj";
import { Cluster, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { getUserPdaCreateIx } from "./subFunction/createUserPda.instruction";
import { getUserPdaUpdateAmountIx } from "./subFunction/updateAmountUserPda.instructions";
import { getUserPdaSellItemIx } from "./subFunction/userPdaAddSellItem.instructions";
import { getUserPdaBuyItemIx } from "./subFunction/userPdaAddBuyItem.instructions";
import { OptionToBuy, OptionToSell } from "../utils/types";

export async function createOrModifyUserPdaInstructions(Data: {
    signer: PublicKey;
    user?: PublicKey;
    clusterOrUrl: Cluster | string;
    amountToTopUp?: { amount: number; mint: PublicKey };
    itemsToBuy?: OptionToBuy[];
    itemsToSell?: OptionToSell[];
    REMOVEitemsToBuy?: OptionToBuy[];
    REMOVEitemsToSell?: OptionToSell[];
    program?: Program;
}): Promise<{ instructions?: TransactionInstruction[][]; userPda: PublicKey }> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
    let instructions: TransactionInstruction[][] = [];
    try {
        console.log("createOrModifyUserPdaInstructions", Data);
        // console.log("XXXXXXXXXXXXXXXXXXXXX");

        const createUserPdaData = await getUserPdaCreateIx({
            program,
            signer: Data.signer,
            user: Data.user,
        });
        console.log("createUserPdaData", createUserPdaData);
        if (!!createUserPdaData.instruction) instructions.push([createUserPdaData.instruction]);
        if (!Data.user || Data.user?.equals(Data.signer)) {
            if (!!Data.amountToTopUp) {
                console.log("Data.amountToTopUp", Data.amountToTopUp);
                const addAmountToTopUpData = await getUserPdaUpdateAmountIx({
                    amountToTopUp: Data.amountToTopUp,
                    program,
                    signer: Data.signer,
                    // mint: Data.amountToTopUp.mint,
                });
                console.log("addAmountToTopUpData", addAmountToTopUpData.length);
                if (!!addAmountToTopUpData) instructions.push(addAmountToTopUpData);
            } else console.log("no amountToTopUp");
            if (!!Data.REMOVEitemsToSell && Data.REMOVEitemsToSell.length > 0) {
                console.log("Data.REMOVEitemsToSell", Data.REMOVEitemsToSell);
                const addSellUserPdaIxs = await getUserPdaSellItemIx({
                    itemsToSell: Data.REMOVEitemsToSell,
                    program,
                    signer: Data.signer,
                    is_removeItem: true,
                });
                console.log("addSellUserPdaIxs", addSellUserPdaIxs.length);
                if (!!addSellUserPdaIxs) instructions.push(...addSellUserPdaIxs);
            } else console.log("no REMOVEitemsToSell");
            if (!!Data.itemsToSell && Data.itemsToSell.length > 0) {
                console.log("Data.itemsToSell", Data.itemsToSell);
                const addSellUserPdaIxs = await getUserPdaSellItemIx({
                    itemsToSell: Data.itemsToSell,
                    program,
                    signer: Data.signer,
                    is_removeItem: false,
                });
                console.log("addSellUserPdaIxs", addSellUserPdaIxs.length);
                if (!!addSellUserPdaIxs) instructions.push(...addSellUserPdaIxs);
            } else console.log("no itemsToSell");
            if (!!Data.REMOVEitemsToBuy && Data.REMOVEitemsToBuy.length > 0) {
                console.log("Data.REMOVEitemsToBuy", Data.REMOVEitemsToBuy);
                const addBuyUserPdaIxs = await getUserPdaBuyItemIx({
                    itemsToBuy: Data.REMOVEitemsToBuy,
                    program,
                    signer: Data.signer,
                    is_removeItem: true,
                });
                console.log("addBuyUserPdaIxs", addBuyUserPdaIxs.length);
                if (!!addBuyUserPdaIxs) instructions.push(addBuyUserPdaIxs);
            } else console.log("no REMOVEitemsToBuy");
            if (!!Data.itemsToBuy && Data.itemsToBuy.length > 0) {
                console.log("Data.itemsToBuy", Data.itemsToBuy);
                const addBuyUserPdaIxs = await getUserPdaBuyItemIx({
                    itemsToBuy: Data.itemsToBuy,
                    program,
                    signer: Data.signer,
                    is_removeItem: false,
                });
                console.log("addBuyUserPdaIxs", addBuyUserPdaIxs.length);

                if (!!addBuyUserPdaIxs) instructions.push(addBuyUserPdaIxs);
            } else console.log("no itemsToBuy");
        } else console.log("user is not signer");

        if (instructions.length > 0) {
            return { instructions, userPda: createUserPdaData.userPda };
        } else return { userPda: createUserPdaData.userPda };
    } catch (error: any) {
        console.log("error init", error);
        throw error;
    }
}
