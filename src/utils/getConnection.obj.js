const { Connection, clusterApiUrl } = require("@solana/web3.js");

function getConnection(cluster, walletSecret) {
    let clusterLink = "";
    if (cluster === "devnet" || cluster === "mainnet-beta" || cluster === "testnet") {
        clusterLink = clusterApiUrl(cluster);
    } else clusterLink = cluster;
    const connection = new Connection(cluster, "confirmed");

    return { connection };
}
