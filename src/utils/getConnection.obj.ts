import { Cluster, Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

export function getConnection(cluster: Cluster) {
    let clusterLink = "";
    if (cluster === "devnet" || cluster === "mainnet-beta" || cluster === "testnet") {
        clusterLink = clusterApiUrl(cluster);
    } else clusterLink = cluster;
    const connection = new Connection(cluster, "confirmed");

    return { connection };
}
