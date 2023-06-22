import {
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
} from "@solana/spl-token";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../utils/const";
import { Program } from "@project-serum/anchor";
import { ApiProcessorConfigType } from "./types";

export async function findOrCreateAta(Data: {
    program: Program;
    owner: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
    isFrontEndFunction?: boolean;
}): Promise<{
    mintAta: PublicKey;
    prepareInstruction?: ApiProcessorConfigType;
    instruction?: TransactionInstruction;
}> {
    try {
        return {
            mintAta: (
                await Data.program.provider.connection.getTokenAccountsByOwner(Data.owner, {
                    mint: Data.mint,
                })
            ).value[0].pubkey,
        };
    } catch (error) {
        const [mintAta, mintAta_bump] = PublicKey.findProgramAddressSync(
            [Data.owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), Data.mint.toBuffer()],
            SOLANA_SPL_ATA_PROGRAM_ID
        );

        if (Data.isFrontEndFunction) {
            return {
                mintAta,
                prepareInstruction: {
                    type: "createAssociatedTokenAccountInstruction",
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
