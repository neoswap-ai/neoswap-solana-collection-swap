import { Cluster, Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

import { CollectionSwap, idlSwap } from "./neoSwap.idl";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "./const";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

export async function getProgram(Data: {
    clusterOrUrl: Cluster | string;
    programId?: PublicKey | string;
    signer?: Keypair;
    idl?: Idl | true;
}): Promise<Program<CollectionSwap>> {
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

    let wallet = new NodeWallet(Data.signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

    if (Data.programId) programId_ = new PublicKey(Data.programId);
    let idl_: CollectionSwap = idlSwap;
    if (Data.idl === true) {
        let tempIdl = (await Program.fetchIdl(programId_, provider)) as CollectionSwap;
        if (tempIdl) {
            console.log("Idl found at ", programId_);
            idl_ = tempIdl;
        } else console.log("Idl not found at ", programId_);
    } else if (Data.idl) idl_ = Data.idl as CollectionSwap;

    
    idl_.address = programId_.toString();
    if (Data.programId) idl_.address = Data.programId.toString();

    const program = new Program(idl_, provider);

    return program;
}
