import { Cluster, Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

import { idlSwap } from "./neoSwap.idl";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "./const";
import { Wallet } from "@coral-xyz/anchor";

export function getProgram(Data: {
    clusterOrUrl: Cluster | string;
    programId?: PublicKey;
    signer?: Keypair;
}) {
    let clusterUrl;
    let programId_ = new PublicKey(NEOSWAP_PROGRAM_ID);

    if (
        Data.clusterOrUrl === "mainnet-beta" ||
        Data.clusterOrUrl === "testnet" ||
        Data.clusterOrUrl === "devnet"
    ) {
        clusterUrl = clusterApiUrl(Data.clusterOrUrl);
    } else {
        if (String(Data.clusterOrUrl).toLowerCase().includes("devnet") && !!!Data.programId) {
            programId_ = new PublicKey(NEOSWAP_PROGRAM_ID_DEV);
        }
        clusterUrl = Data.clusterOrUrl;
    }
    // console.log("clusterUrl", clusterUrl);

    const connection = new Connection(clusterUrl, "confirmed");
    if (!Data.signer) Data.signer = Keypair.generate();
    const wallet = new Wallet(Data.signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

    let idl_ = idlSwap;

    if (Data.programId) programId_ = new PublicKey(Data.programId);

    const program = new Program(idl_, programId_, provider);

    return program;
}
