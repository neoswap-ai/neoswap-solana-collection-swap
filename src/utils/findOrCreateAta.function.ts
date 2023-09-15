import {
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
} from "@solana/spl-token";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../utils/const";
import { Program } from "@project-serum/anchor";
import { ApiProcessorConfigType, CreateAssociatedTokenAccountInstructionData } from "./types";
import { delay } from "./delay";

export async function findOrCreateAta(Data: {
    program: Program;
    owner: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
    prepareInstructions?: boolean;
}): Promise<{
    mintAta: PublicKey;
    instruction?: TransactionInstruction;
    prepareInstruction?: CreateAssociatedTokenAccountInstructionData;
}> {
    try {
        let values: { address: PublicKey; value: number }[] = [];
        let mintAtas = (
            await Data.program.provider.connection.getTokenAccountsByOwner(Data.owner, {
                mint: Data.mint,
            })
        ).value;
        let mintAta = mintAtas[0].pubkey;
        // console.log("mintAtas", mintAtas);

        if (mintAtas.length > 1) {
            console.log("more than 1 ata", mintAtas);

            for await (const ata of mintAtas) {
                let balance = await Data.program.provider.connection.getTokenAccountBalance(
                    ata.pubkey
                );
                await delay(1000);
                if (balance.value.uiAmount || balance.value.uiAmount === 0)
                    values.push({ value: balance.value.uiAmount, address: ata.pubkey });
            }
            // await Promise.all(
            //     mintAtas.map(async (ata) => {
            //     })
            // );

            values.sort((a, b) => b.value - a.value);
            mintAta = values[0].address;
        }
        // console.log("users ATAs:"), values;

        return {
            mintAta,
        };
    } catch (eee) {
        console.log("no ata found, creating one");

        const mintAta = PublicKey.findProgramAddressSync(
            [Data.owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), Data.mint.toBuffer()],
            SOLANA_SPL_ATA_PROGRAM_ID
        )[0];

        if (Data.prepareInstructions) {
            return {
                mintAta,
                prepareInstruction: {
                    type: "createAssociatedTokenAccountInstruction",
                    programId: Data.program.programId.toString(),
                    data: {
                        payer: Data.signer.toString(),
                        associatedToken: mintAta.toString(),
                        owner: Data.owner.toString(),
                        mint: Data.mint.toString(),
                    },
                },
            };
        } else {
            return {
                mintAta,
                instruction: createAssociatedTokenAccountInstruction(
                    Data.signer,
                    mintAta,
                    Data.owner,
                    Data.mint
                ),
            };
        }
    }
}
