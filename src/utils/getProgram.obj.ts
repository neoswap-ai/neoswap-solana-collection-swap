import { Cluster, Connection, Keypair, PublicKey, Signer, clusterApiUrl } from "@solana/web3.js";

import { idl } from "./neoSwap.idl";
import { Program, Wallet, AnchorProvider } from "@project-serum/anchor";
import { SWAP_PROGRAM_ID } from "./const";

export function getProgram(cluster: Cluster | string, signer?: Keypair): Program {
    let clusterUrl;

    if (cluster === "mainnet-beta" || cluster === "testnet") {
        clusterUrl = clusterApiUrl(cluster);
    } else if (cluster === "devnet") {
        clusterUrl =
            "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
    } else {
        clusterUrl = cluster;
    }

    const connection = new Connection(clusterUrl, "confirmed");
    if (!signer) signer = Keypair.generate();
    const wallet = new Wallet(signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program(idl, new PublicKey(SWAP_PROGRAM_ID), provider);

    return program;
}
