import { AccountMeta, Cluster, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getProgram } from "./getProgram.obj";
import { ConcurrentMerkleTreeAccount } from "@solana/spl-account-compression";
import { decode } from "bs58";
import { BN, Program } from "@coral-xyz/anchor";

export async function getCNFTData(Data: { tokenId: string; Cluster: Cluster; program?: Program }) {
    let solanaUrl = clusterApiUrl(Data.Cluster);
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
    // console.log("treeData Results", treeData);
    // const owner = new PublicKey(treeData.ownership.owner);
    const treeProofResponse = await fetch(solanaUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAssetProof",
            params: {
                id: Data.tokenId.toString(),
            },
        }),
    });
    let treeProof = (await treeProofResponse.json()).result;

    // console.log("treeProof Results", treeProof);
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.Cluster });
    // retrieve the merkle tree's account from the blockchain
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
        program.provider.connection,
        new PublicKey(treeProof.tree_id)
    );
    // console.log("treeAccount", treeAccount);

    // extract the needed values for our transfer instruction
    const treeAuthority = treeAccount.getAuthority();
    const canopyDepth = treeAccount.getCanopyDepth();

    // console.log("treeAuthority", treeAuthority);
    // console.log("canopyDepth", canopyDepth);

    const proofMeta: AccountMeta[] = treeProof.proof
        .slice(0, treeProof.proof.length - (!!canopyDepth ? canopyDepth : 0))
        .map((node: string) => ({
            pubkey: new PublicKey(node),
            isSigner: false,
            isWritable: false,
        }));
    // console.log("proofMeta", proofMeta);
    // const proof = proofMeta.map((node: AccountMeta) => node.pubkey.toString());
    // console.log('proof', proof);

    // console.log('treeProof.root', treeProof.root);
    // console.log('treeData.data_hash', treeProof);
    // console.log('treeData.creator_hash', treeData.compression);

    // let instructions = [];
    let root = decode(treeProof.root);
    let dataHash = decode(treeData.compression.data_hash); //new PublicKey().toBytes();
    let creatorHash = decode(treeData.compression.creator_hash);
    let nonce = new BN(treeData.compression.leaf_id);
    let index = treeData.compression.leaf_id;

    // console.log('nonce', nonce);
    // console.log("args", root, dataHash, creatorHash, nonce, index);
    // console.log(
    //     "accounts",
    //     "\nleafOwner:",
    //     Data.signer,
    //     "\nleafDelegate: ",
    //     Data.signer,
    //     "\ntreeAuthority",
    //     treeAuthority,
    //     " \nmerkleTree:",
    //     treeProof.tree_id,
    //     " \nnewLeafOwner:",
    //     Data.destinary,
    //     "\nlogWrapper:",
    //     SPL_NOOP_PROGRAM_ID,
    //     "\ncompressionProgram:",
    //     SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    //     "\nbubblegumProgram:",
    //     MPL_BUBBLEGUM_PROGRAM_ID,

    //     "\nsystemProgram:",
    //     SystemProgram.programId.toBase58(),
    //     " \nanchorRemainingAccounts:",
    //     proofMeta
    // );

    return {
        root,
        dataHash,
        creatorHash,
        nonce,
        index,
        treeAuthority,
        merkleTree: new PublicKey(treeProof.tree_id),
        proofMeta,
        canopyDepth,
    };
}

export function getProofMeta(proof: string[]) {
    return proof.map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
    }));
}

export async function getMerkleTreeAndIndex(Data: { tokenId: PublicKey; Cluster: Cluster }) {
    let solanaUrl = clusterApiUrl(Data.Cluster);
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
    // console.log("treeData Results", treeData);
    // console.log("treeData Results", Data.tokenId, {
    //     merkleTree: treeData.compression.tree,
    //     index: treeData.compression.leaf_id,
    // });
    if (!!!treeData) throw "No treeData found, verify the tokenId : " + Data.tokenId.toBase58();
    return {
        merkleTree: new PublicKey(treeData.compression.tree),
        index: new BN(treeData.compression.leaf_id),
    };
}

export async function getCNFTOwner(Data: { Cluster: Cluster; tokenId: string }) {
    let solanaUrl = clusterApiUrl(Data.Cluster);
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
    let resp = await treeDataReponse.json();
    console.log("resp", resp);

    let treeData = resp.result;
    console.log("treeData Results", treeData);
     if (!treeData.compression.compressed) throw 'not cNFT'
    return new PublicKey(treeData.ownership.owner);
}
