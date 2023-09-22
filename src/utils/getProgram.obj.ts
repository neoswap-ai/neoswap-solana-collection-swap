import { Cluster, Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

import { idlSwap } from "./neoSwap.idl";
import { Program, AnchorProvider } from "@project-serum/anchor";
import { SWAP_PROGRAM_ID, SWAP_PROGRAM_ID_DEV } from "./const";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

export function getProgram(Data: {
    clusterOrUrl: Cluster | string;
    programId?: PublicKey;
    signer?: Keypair;
}): Program {
    let clusterUrl;
    let programId_ = new PublicKey(SWAP_PROGRAM_ID);

    if (Data.clusterOrUrl === "mainnet-beta" || Data.clusterOrUrl === "testnet") {
        clusterUrl = clusterApiUrl(Data.clusterOrUrl);
    } else {
        if (String(Data.clusterOrUrl).toLowerCase().includes("devnet")) {
            programId_ = new PublicKey(SWAP_PROGRAM_ID_DEV);
        }
        clusterUrl = Data.clusterOrUrl;
    }
    // console.log("clusterUrl", clusterUrl);

    const connection = new Connection(clusterUrl, "confirmed");
    if (!Data.signer) Data.signer = Keypair.generate();
    const wallet = new NodeWallet(Data.signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

    let idl_ = idlSwap;

    if (Data.programId) programId_ = new PublicKey(Data.programId);

    const program = new Program(idl_, programId_, provider);
    console.log("programId", program.programId.toBase58());

    return program;
}
