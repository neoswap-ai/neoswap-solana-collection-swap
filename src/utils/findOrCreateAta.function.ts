import {
    createAssociatedTokenAccountInstruction,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Cluster, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
    SOLANA_SPL_ATA_PROGRAM_ID,
    NEOSWAP_PROGRAM_ID,
    NEOSWAP_PROGRAM_ID_DEV,
} from "../utils/const";
import { delay } from "./delay";

export async function findOrCreateAta(Data: {
    clusterOrUrl?: Cluster | string;
    connection?: Connection;
    owner: string;
    mint: string;
    signer: string;
}): Promise<{
    mintAta: string;
    instruction?: TransactionInstruction;
    tokenProgram?: string;
}> {
    if (!!Data.clusterOrUrl && !!Data.connection) {
    } else if (!!Data.clusterOrUrl) {
        Data.connection = new Connection(Data.clusterOrUrl);
    } else if (!!Data.connection) {
        Data.clusterOrUrl = Data.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";
    // let { mint, owner, signer } = Data;
    // console.log("mint", mint, "owner", owner, "signer", signer);
    let tokenProg = (
        await Data.connection.getAccountInfo(new PublicKey(Data.mint))
    )?.owner.toString();
    if (!tokenProg) tokenProg = TOKEN_PROGRAM_ID.toString();

    try {
        let values: { address: PublicKey; value: number }[] = [];
        let mintAtas = (
            await Data.connection.getParsedTokenAccountsByOwner(new PublicKey(Data.owner), {
                mint: new PublicKey(Data.mint),
                programId: new PublicKey(tokenProg),
            })
        ).value;
        // console.log("mintAtas", mintAtas);
        if (mintAtas.length === 0) {
            const mintAta = PublicKey.findProgramAddressSync(
                [
                    new PublicKey(Data.owner).toBuffer(),
                    new PublicKey(tokenProg).toBuffer(),
                    new PublicKey(Data.mint).toBuffer(),
                ],
                new PublicKey(SOLANA_SPL_ATA_PROGRAM_ID)
            )[0].toString();
            console.log(
                "no ata found, creating ",
                mintAta,
                " from ",
                Data.owner,
                "mint",
                Data.mint,
                tokenProg == TOKEN_PROGRAM_ID.toString()
                    ? "native"
                    : tokenProg == TOKEN_2022_PROGRAM_ID.toString()
                    ? "2022"
                    : "inknown"
            );

            return {
                mintAta,
                instruction: createAssociatedTokenAccountInstruction(
                    new PublicKey(Data.signer),
                    new PublicKey(mintAta),
                    new PublicKey(Data.owner),
                    new PublicKey(Data.mint),
                    new PublicKey(tokenProg)
                ),
                // tokenProgram: tokProg,
            };
        }
        let mintAta = mintAtas[0].pubkey.toString();
        let tokenProgram = mintAtas[0].account.owner.toString();
        if (mintAtas.length > 1) {
            console.log("more than 1 ata", mintAtas);

            for await (const ata of mintAtas) {
                let balance = await Data.connection.getTokenAccountBalance(ata.pubkey);
                await delay(1000);
                if (balance.value.uiAmount || balance.value.uiAmount === 0)
                    values.push({ value: balance.value.uiAmount, address: ata.pubkey });
            }

            values.sort((a, b) => b.value - a.value);
            mintAta = values[0].address.toString();
        }

        console.log(
            "mintAta",
            mintAta,
            Data.owner,
            "tokenProgram",
            tokenProgram == TOKEN_PROGRAM_ID.toString()
                ? "native"
                : tokenProg == TOKEN_PROGRAM_ID.toString()
                ? "native"
                : tokenProg == TOKEN_2022_PROGRAM_ID.toString()
                ? "2022"
                : "inknown" 
        );

        return {
            mintAta,
            tokenProgram: tokenProg,
        };
    } catch (eee) {
        const mintAta = PublicKey.findProgramAddressSync(
            [
                new PublicKey(Data.owner).toBuffer(),
                new PublicKey(tokenProg).toBuffer(),
                new PublicKey(Data.mint).toBuffer(),
            ],
            new PublicKey(SOLANA_SPL_ATA_PROGRAM_ID)
        )[0].toString();

        console.log("no ata found, creating ", mintAta, " from ", Data.owner, "mint", Data.mint);

        return {
            mintAta,
            instruction: createAssociatedTokenAccountInstruction(
                new PublicKey(Data.signer),
                new PublicKey(mintAta),
                new PublicKey(Data.owner),
                new PublicKey(Data.mint),
                new PublicKey(tokenProg)
            ),
            tokenProgram: tokenProg.toString(),
        };
    }
}
