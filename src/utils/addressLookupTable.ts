import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    AddressLookupTableProgram,
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import {
    FAIR_LAUNCH_PROGRAM_ID,
    METAPLEX_AUTH_RULES_PROGRAM,
    NS_FEE,
    TOKEN_METADATA_PROGRAM,
} from "./const";
import {
    SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
    SPL_COMPUTE_BUDGET_PROGRAM_ID,
} from "@metaplex-foundation/mpl-toolbox";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { delay } from "./delay";
import { ix2vTx } from "./vtx";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
import { addPrioFeeIx } from "./fees";

export async function createLookUpTableAccount({
    authority,
    connection,
    payer,
    additionalAccounts,
    lookUpTableAccount,
}: // keypair,
{
    authority?: string;
    payer: string;
    connection: Connection;
    additionalAccounts?: string[];
    lookUpTableAccount?: string;
    // keypair?: Keypair;
}) {
    // let recentSlot = await connection.getSlot();
    // console.log("recentSlot", recentSlot);

    let auth = new PublicKey(authority || payer);
    let pay = new PublicKey(payer);
    let instructions: TransactionInstruction[] = [];
    if (!lookUpTableAccount) {
        const currentSlot = await connection.getSlot();
        let getblock = Math.max(currentSlot - 200, 0);
        const slots = (await connection.getBlocks(getblock)).sort((a, b) => b - a);
        console.log("currentSlot:", currentSlot, " slot used", slots[1]);
        // if (slots.length < 100) {
        //     throw new Error(`Could find only ${slots.length} ${slots} on the main fork`);
        // }
        // console.log("slots", slots);

        const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
            authority: auth,
            payer: pay,
            recentSlot: slots[1],
        });
        instructions.push(lookupTableInst);
        lookUpTableAccount = lookupTableAddress.toString();
        console.log("creating lookUpTableAccount");
    }

    let addresses = [
        new PublicKey(NS_FEE),
        SystemProgram.programId,
        TOKEN_2022_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(SPL_ASSOCIATED_TOKEN_PROGRAM_ID),
        new PublicKey(MPL_CORE_PROGRAM_ID),
        new PublicKey(METAPLEX_AUTH_RULES_PROGRAM),
        MPL_BUBBLEGUM_PROGRAM_ID,
        SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        SPL_NOOP_PROGRAM_ID,
        new PublicKey(SPL_COMPUTE_BUDGET_PROGRAM_ID),
        new PublicKey(TOKEN_METADATA_PROGRAM),
        new PublicKey(FAIR_LAUNCH_PROGRAM_ID),
        WRAPPED_SOL_MINT,
        SYSVAR_INSTRUCTIONS_PUBKEY,
        
    ];
    if (additionalAccounts) addresses.push(...additionalAccounts.map((acc) => new PublicKey(acc)));
    console.log("AddressLookupTableProgram", AddressLookupTableProgram.programId.toString());

    const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: pay,
        authority: auth,
        lookupTable: new PublicKey(lookUpTableAccount),
        addresses,
    });
    instructions.push(addAddressesInstruction);

    // if (keypair && !lookUpTableAccount) {
    //     let vtx = await ix2vTx(
    //         instructions,
    //         { clusterOrUrl: connection.rpcEndpoint },
    //         keypair.publicKey.toString()
    //     );
    //     vtx.sign([keypair]);
    //     let lut_hash = await connection.sendTransaction(vtx, { preflightCommitment: "confirmed" });
    //     console.log("lut_hash", lut_hash);
    // }
    return { instructions, lookUpTableAccount };
}

export async function createVTxWithLookupTable({
    connection,
    instructions,
    lookUpTableAccount,
    payer,
    prioritizationFee,
}: {
    lookUpTableAccount?: string;
    instructions: TransactionInstruction[];
    connection: Connection;
    payer: string;
    prioritizationFee?: number;
}) {
    // await delay(1000);
    let recentBlockhash = (await connection.getLatestBlockhash({ commitment: "confirmed" }))
        .blockhash;
    const transactionMessage = new TransactionMessage({
        payerKey: new PublicKey(payer),
        recentBlockhash,
        instructions: await addPrioFeeIx(instructions, prioritizationFee),
    });
    if (lookUpTableAccount) {
        const lookupTableResp = await connection.getAddressLookupTable(
            new PublicKey(lookUpTableAccount),
            {
                commitment: "confirmed",
            }
        );
        let lookupTable = lookupTableResp.value!;
        // console.log("lookUpTableAccount", lookupTable);

        if (!lookupTable) throw new Error("Lookup table not found");

        let cMess = transactionMessage.compileToV0Message([lookupTable]);
        return new VersionedTransaction(cMess);
    }
    return new VersionedTransaction(transactionMessage.compileToV0Message());
}
