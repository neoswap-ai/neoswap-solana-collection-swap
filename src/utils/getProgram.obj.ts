import { Cluster, Connection, Keypair, PublicKey, Signer, clusterApiUrl } from "@solana/web3.js";

import { idl } from "./neoSwap.idl";
import { Program, Wallet, AnchorProvider, getProvider } from "@project-serum/anchor";
import { SWAP_PROGRAM_ID } from "./const";

export function getProgram(cluster: Cluster, signer: Keypair) {
    let clusterUrl = clusterApiUrl(cluster);
    if (cluster === "devnet")
        clusterUrl =
            "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
    const connection = new Connection(clusterUrl, "confirmed");
    if (!signer) signer = Keypair.generate();
    const wallet = new Wallet(signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program(idl, new PublicKey(SWAP_PROGRAM_ID), provider);

    return { program };
}
// module.exports = getProgram;
