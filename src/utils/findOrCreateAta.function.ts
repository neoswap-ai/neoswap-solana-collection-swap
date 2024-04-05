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
}> {
    if (!!Data.clusterOrUrl && !!Data.connection) {
    } else if (!!Data.clusterOrUrl) {
        Data.connection = new Connection(Data.clusterOrUrl);
    } else if (!!Data.connection) {
        Data.clusterOrUrl = Data.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    try {
        let values: { address: PublicKey; value: number }[] = [];
        let programId = (await Data.connection.getAccountInfo(Data.mint))?.owner;
        let mintAtas = (
            await Data.connection.getParsedTokenAccountsByOwner(new PublicKey(Data.owner), {
                mint: new PublicKey(Data.mint),
            })
        ).value;
        let mintAta = mintAtas[0].pubkey.toString();
        // console.log("mintAtas", mintAtas);

        if (mintAtas.length > 1) {
            console.log("more than 1 ata", mintAtas);

            for await (const ata of mintAtas) {
                let balance = await Data.connection.getTokenAccountBalance(ata.pubkey);
                await delay(1000);
                if (balance.value.uiAmount || balance.value.uiAmount === 0)
                    values.push({ value: balance.value.uiAmount, address: ata.pubkey });
            }
            // await Promise.all(
            //     mintAtas.map(async (ata) => {
            //     })
            // );

            values.sort((a, b) => b.value - a.value);
            mintAta = values[0].address.toString();
        }
        // console.log("users ATAs:"), values;

        return {
            mintAta,
        };
    } catch (eee) {
        let tokProg;
        try {
            tokProg = (await Data.connection.getParsedAccountInfo(new PublicKey(Data.mint))).value
                ?.owner;
        } catch {}
        
        if (!tokProg) tokProg = TOKEN_PROGRAM_ID;

        const mintAta = PublicKey.findProgramAddressSync(
            [
                new PublicKey(Data.owner).toBuffer(),
                tokProg.toBuffer(),
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
                tokProg
            ),
        };
    }
}
