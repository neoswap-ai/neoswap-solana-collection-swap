import {
    createSyncNativeInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SOLANA_SPL_ATA_PROGRAM_ID } from "../utils/const";
import { Program } from "@project-serum/anchor";

export async function findOrCreateAta(Data: {
    program: Program;
    owner: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
    isFrontEndFunction?: boolean;
}) {
    try {
        let mintAta = (
            await Data.program.provider.connection.getTokenAccountsByOwner(Data.owner, {
                mint: Data.mint,
            })
        ).value[0].pubkey;
        // if ((await Data.program.provider.connection.getBalance(mintAta)) === 0) {
        //     throw "ata balance is 0";
        // }
        return {
            mintAta,
        };
    } catch (error) {
        // let res;
        // if (isFrontEndFunction === true) {
        //     res = await solanaSwap.createPdaAtaforDeposit({ mint, signer, owner });
        // } else {

        const [mintAta, mintAta_bump] = PublicKey.findProgramAddressSync(
            [Data.owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), Data.mint.toBuffer()],
            SOLANA_SPL_ATA_PROGRAM_ID
        );

        if (Data.isFrontEndFunction) {
            // console.log("creating ata front end");
            return {
                mintAta,
                prepareInstruction: {
                    type: "createAssociatedTokenAccountInstruction",
                    data: {
                        payer: Data.signer,
                        associatedToken: mintAta,
                        owner: Data.owner,
                        mint: Data.mint,
                    },
                },
            };
        } else {
            // console.log("creating normal ata");

            const instruction = createAssociatedTokenAccountInstruction(
                Data.signer,
                mintAta,
                Data.owner,
                Data.mint
            );

            return { mintAta, instruction };
        }
    }
}
