import {
    createAssociatedTokenAccountIdempotentInstruction,
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
import { standardToProgram, whichStandard } from "./findNftDataAndAccounts.function";

export async function findOrCreateAta(Data: {
    clusterOrUrl?: Cluster | string;
    connection?: Connection;
    owner: string;
    mint: string;
    signer: string;
}): Promise<{
    mintAta: string;
    instruction?: TransactionInstruction;
    // tokenStandard: "core" | "native" | "hybrid"
}> {
    if (!!Data.clusterOrUrl && !!Data.connection) {
    } else if (!!Data.clusterOrUrl) {
        Data.connection = new Connection(Data.clusterOrUrl);
    } else if (!!Data.connection) {
        Data.clusterOrUrl = Data.connection.rpcEndpoint;
    } else throw "there should be a Program or a Cluster";

    let tokenStandard = await whichStandard({ connection: Data.connection, mint: Data.mint });
    let tokenProg = standardToProgram(tokenStandard);

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
                tokenStandard
            );

            return {
                mintAta,
                instruction: createAssociatedTokenAccountIdempotentInstruction(
                    new PublicKey(Data.signer),
                    new PublicKey(mintAta),
                    new PublicKey(Data.owner),
                    new PublicKey(Data.mint),
                    new PublicKey(tokenProg)
                ),
            };
        }
        let mintAta = mintAtas[0].pubkey.toString();
        if (mintAtas.length > 1) {
            console.log("more than 1 ata", mintAtas);

            for await (const ata of mintAtas) {
                let balance = await Data.connection.getTokenAccountBalance(ata.pubkey);
                await delay(300);
                if (balance.value.uiAmount || balance.value.uiAmount === 0)
                    values.push({ value: balance.value.uiAmount, address: ata.pubkey });
            }

            values.sort((a, b) => b.value - a.value);
            mintAta = values[0].address.toString();
        }

        // console.log(tokenStandard, mintAta, Data.owner);

        return {
            mintAta,
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
            instruction: createAssociatedTokenAccountIdempotentInstruction(
                new PublicKey(Data.signer),
                new PublicKey(mintAta),
                new PublicKey(Data.owner),
                new PublicKey(Data.mint),
                new PublicKey(tokenProg)
            ),
        };
    }
}
