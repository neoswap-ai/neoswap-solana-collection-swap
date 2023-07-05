import { Cluster, Connection, Keypair, PublicKey, Signer, clusterApiUrl } from "@solana/web3.js";

import { idlSwap } from "./neoSwap.idl";
import { idlOrdinals } from "./ordinals.idl";
import { Program, Wallet, AnchorProvider } from "@project-serum/anchor";
import { SWAP_PROGRAM_ID, ORDINAL_PROGRAM_ID } from "./const";

export function getProgram(Data: {
    clusterOrUrl: Cluster | string;
    isOrdinals?: boolean;
    programId?: PublicKey;
    signer?: Keypair;
}): Program {
    let clusterUrl;

    if (Data.clusterOrUrl === "mainnet-beta" || Data.clusterOrUrl === "testnet") {
        clusterUrl = clusterApiUrl(Data.clusterOrUrl);
    } else if (Data.clusterOrUrl === "devnet") {
        clusterUrl =
            "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
    } else {
        clusterUrl = Data.clusterOrUrl;
    }

    const connection = new Connection(clusterUrl, "confirmed");
    if (!Data.signer) Data.signer = Keypair.generate();
    const wallet = new Wallet(Data.signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

    let idl_ = idlSwap;
    let programId_ = new PublicKey(SWAP_PROGRAM_ID);

    if (Data.isOrdinals) {
        idl_ = idlOrdinals;
        programId_ = new PublicKey(ORDINAL_PROGRAM_ID);
    }

    if (Data.programId) programId_ = new PublicKey(Data.programId);

    const program = new Program(idl_, programId_, provider);

    return program;
}
