import {
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "./const";
import { Program } from "@project-serum/anchor";
import {
    ApiProcessorConfigType,
    CreateAssociatedTokenAccountInstructionData,
    ErrorFeedback,
} from "./types";
import { delay } from "./delay";

export async function errorIfInsufficientBalance(Data: {
    connection: Connection;
    owner: PublicKey;
    mint: PublicKey;
    amount: number;
    // signer: PublicKey;
    // prepareInstructions?: boolean;
}): Promise<boolean> {
    try {
        if (!NATIVE_MINT.toString().includes(Data.mint.toString())) {
            let values: { address: PublicKey; value: number }[] = [];
            let mintAtas = (
                await Data.connection.getTokenAccountsByOwner(Data.owner, {
                    mint: Data.mint,
                })
            ).value;
            let mintAta = mintAtas[0].pubkey;

            if (mintAtas.length > 1) {
                console.log("more than 1 ata", mintAtas);

                for await (const ata of mintAtas) {
                    let balance = await Data.connection.getTokenAccountBalance(ata.pubkey);
                    await delay(1000);
                    if (balance.value.uiAmount || balance.value.uiAmount === 0)
                        values.push({ value: balance.value.uiAmount, address: ata.pubkey });
                }

                values.sort((a, b) => b.value - a.value);
                if (values[0].value < Data.amount)
                    throw `not enough balance ${values[0].value} < ${Data.amount}`;
                mintAta = values[0].address;
            } else {
                let balance = await Data.connection.getTokenAccountBalance(mintAta);

                if (!!!balance.value.uiAmount || balance.value.uiAmount < Data.amount)
                    throw `not enough balance for ${Data.mint.toBase58()} from user ${Data.owner.toBase58()} ===>  ${
                        balance.value.uiAmount
                    } < ${Data.amount}`;
            }
            return true;
        } else {
            let balance = await Data.connection.getBalance(Data.owner);
            if (balance < Data.amount)
                throw `not enough balance for native Sol from user ${Data.owner.toBase58()} ===>  ${balance} < ${
                    Data.amount
                }`;
            return true;
        }
        // mintAta
        // console.log("users ATAs:"), values;
    } catch (message) {
        console.log("no ata found", message);
        throw {
            blockchain: "solana",
            status: "error",
            message,
        } as ErrorFeedback;
    }
}
