import { PublicKey, clusterApiUrl } from "@solana/web3.js";

export async function getMerkleTree(Data: { tokenId: PublicKey }) {
    let solanaUrl = clusterApiUrl("mainnet-beta");
    const treeDataReponse = await fetch(solanaUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAsset",
            params: {
                id: Data.tokenId.toString(),
            },
        }),
    });
    let treeData = (await treeDataReponse.json()).result;
    console.log("treeData Results", treeData);
    return new PublicKey(treeData.compression.tree);
}
