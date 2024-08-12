import { decode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";
import {
    DasApiAsset,
    GetAssetProofRpcResponse,
} from "@metaplex-foundation/digital-asset-standard-api";
import { TokenStandard } from "@metaplex-foundation/mpl-bubblegum";
import { ConcurrentMerkleTreeAccount } from "@solana/spl-account-compression";
import { AccountMeta, Cluster, clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { BUBBLEGUM_PROGRAM_ID, computeMetadataArgsHash } from "@tensor-hq/tensor-common";
import BN from "bn.js";
import { keccak_256 } from "js-sha3";
import { keccak_256 as bubbleHash } from "@noble/hashes/sha3";

import { createHash } from "crypto";
import { mergeBytes, publicKey, u64, u8 } from "@metaplex-foundation/umi/serializers";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PROGRAM_ID as MPL_BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { getLeafAssetId } from "@metaplex-foundation/mpl-bubblegum";
import { delay } from "./delay";

export async function getCompNFTData({
    cluster,
    tokenId,
    connection,
    getRootHash,
    newOwner,
}: // verifyOwnership,
{
    tokenId: string;
    cluster?: Cluster;
    connection?: Connection;
    getRootHash?: "onchain" | "calculate" | "calculateAndVerify" | "DAS";
    newOwner?: string;
    // verifyOwnership?: boolean;
}) {
    let treeData = await retrieveDASAssetFields(tokenId);
    // console.log("treeData", treeData);
    let treeProof = await retrieveDASProofFields(tokenId);
    // console.log("treeProof", treeProof);

    const conn = connection ?? new Connection(clusterApiUrl(cluster ?? "mainnet-beta"));
    // console.log(treeProof.tree_id, "connection", connection.rpcEndpoint);

    // retrieve the merkle tree's account from the blockchain
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
        conn,
        new PublicKey(treeProof.tree_id)
    );
    // console.log("treeAccount", treeAccount);
    // treeAccount.tree.changeLogs[0].
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
    const fullproof = treeProof.proof.map((v) => v.toString());

    let creatorHash = Array.from(decode(treeData.compression.creator_hash));
    // console.log("creatorHash", creatorHash);

    let nonce = new BN(treeData.compression.leaf_id);
    let index = Number(treeData.compression.leaf_id);
    // console.log("nonce", nonce, "index", index);

    let collection = treeData.grouping.find(
        (v: { group_key: string; group_value: string }) => v.group_key === "collection"
    )!.group_value;

    let hh = await constructMetaHash(tokenId);

    let metadata = hh!.metadataArgs!;
    // let metaHash = Array.from(hh?.metaHash!);
    // let calcDatahsh = Array.from(hh?.dataHash!);
    let dataHash = Array.from(decode(treeData.compression.data_hash)); //new PublicKey().toBytes();
    // console.log("dataHash", dataHash, "calcDatahsh", calcDatahsh);
    let creators = metadata.creators;

    let root: number[] = Array.from(new PublicKey(treeProof.root).toBuffer());
    let leafHash: number[] = Array.from(new PublicKey(treeProof.leaf).toBuffer());
    let owner = newOwner ?? treeData.ownership.owner.toString();
    let onchainRoot = Array.from(treeAccount.getCurrentRoot());

    // console.log("owner", owner, " vs ", treeData.ownership.owner.toString());

    if (!getRootHash) {
    } else if (getRootHash === "onchain") {
        root = onchainRoot;
    } else if (getRootHash.includes("calculate")) {
        // console.log('DAS',{
        //     leafAssetId: tokenId,
        //     leafIndex: index,
        //     metadataHash: (dataHash),
        //     owner: owner,
        //     creatorHash: creatorHash,
        // });
        // console.log("treeData.ownership.delegate", treeData.ownership.delegate);
        let { root: calcRoot, leafHash: calcLeaf } = await recalculateRoot({
            tokenId: tokenId,
            connection: conn,
            owner,
            creatorHash: bs58.encode(creatorHash),
            dataHash: bs58.encode(dataHash),
            fullproof,
            index,
        });
        // console.log(bs58.encode(calcLeaf), "calcLeaf vs leafhash", bs58.encode(leafHash));
        // console.log(
        //     bs58.encode(calcRoot),
        //     "calcroot vs roothash",
        //     bs58.encode(onchainRoot),
        //     " vs root ",
        //     bs58.encode(root)
        // );

        if (getRootHash === "calculateAndVerify") {
            if (bs58.encode(calcRoot) !== bs58.encode(onchainRoot)) {
                console.log(
                    "Roots don't match, calculated : ",
                    bs58.encode(calcRoot),
                    "original :",
                    bs58.encode(onchainRoot)
                );

                throw `Roots don't match : owner :${owner} vs DAS:${treeData.ownership.owner.toString()}`;
            }
        }
    }

    // console.log('nonce', nonce);
    // console.log("args", root, dataHash, creatorHash, nonce, index);
    // console.log(
    //     "accounts",

    //     "\nroot",
    //     encode(root),
    //     "\ndataHash",
    //     encode(dataHash),
    //     "\ncreatorHash",
    //     encode(creatorHash),
    //     "\nnonce",
    //     nonce,
    //     "\nindex",
    //     index,
    //     "\ntreeAuthority",
    //     treeAuthority.toBase58(),
    //     "\nmerkleTree:",
    //     new PublicKey(treeProof.tree_id).toString(),
    //     "\nproofMeta",
    //     proofMeta,
    //     "\ncanopyDepth",
    //     canopyDepth
    // );

    return {
        fullproof,
        root,
        dataHash,
        creatorHash,
        nonce,
        index,
        treeAuthority,
        merkleTree: treeProof.tree_id,
        proofMeta,
        canopyDepth,
        collection,
        metadata,
        owner,
        leafHash,
        creators,
    };
}

export function getProofMeta(proof: string[]) {
    return proof.map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
    }));
}

export async function getMerkleTreeAndIndex(Data: { tokenId: string; Cluster: Cluster }) {
    let treeData = await retrieveDASAssetFields(Data.tokenId);

    if (!!!treeData) throw "No treeData found, verify the tokenId : " + Data.tokenId;
    return {
        merkleTree: treeData.compression.tree,
        index: new BN(treeData.compression.leaf_id),
    };
}

export async function getCNFTOwner(Data: { Cluster: Cluster; tokenId: string }) {
    let treeData = await retrieveDASAssetFields(Data.tokenId);
    // console.log("treeData Results", treeData);
    if (!treeData.compression.compressed) throw "not cNFT";
    return treeData.ownership.owner;
}

const helius_url = "https://mainnet.helius-rpc.com/?api-key=3df6d163-6527-46bf-aa92-5f2e7af41aa4";
export async function retrieveDASProofFields(mint: string) {
    // query DAS API for proof info
    const proofData = await fetch(helius_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAssetProof",
            params: {
                id: mint,
            },
        }),
    });

    let proofRes = (await proofData.json()).result as GetAssetProofRpcResponse;

    return proofRes;
}

export async function retrieveDASAssetFields(mint: string) {
    // query DAS API for asset info
    const assetData = await fetch(helius_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method: "getAsset",
            params: {
                id: mint,
            },
        }),
    });

    let assetRes = (await assetData.json()).result as DasApiAsset;

    return assetRes;
}

// helper function for constructing meta hash, return used metadataArgs as well if returnArgs=true
export async function constructMetaHash(mint: string) {
    // query DAS API for asset info
    const assetRes = await retrieveDASAssetFields(mint);
    const {
        compression,
        content,
        royalty,
        creators,
        uses,
        grouping,
        supply,
        ownership: { owner, delegate },
        mutable,
    } = assetRes;
    const coll = grouping.find((group: any) => group.group_key === "collection")?.group_value;
    const tokenStandard = content.metadata.token_standard;
    const dataHashBuffer = new PublicKey(compression.data_hash).toBuffer();

    // construct metadataArgs to hash later
    // ordering follows https://docs.metaplex.com/programs/token-metadata/accounts
    var metadataArgs = {
        name: content?.metadata?.name ?? "",
        symbol: content?.metadata?.symbol ?? " ",
        uri: content?.json_uri ?? "",
        sellerFeeBasisPoints: royalty.basis_points,
        creators: creators.map((creator: any) => ({
            address: new PublicKey(creator.address),
            share: creator.share,
            verified: creator.verified,
        })),
        primarySaleHappened: royalty.primary_sale_happened,
        isMutable: mutable,
        editionNonce: supply?.edition_nonce != null ? supply!.edition_nonce : null,
        tokenStandard:
            tokenStandard === "Fungible"
                ? TokenStandard.Fungible
                : tokenStandard === "NonFungibleEdition"
                ? TokenStandard.NonFungibleEdition
                : tokenStandard === "FungibleAsset"
                ? TokenStandard.FungibleAsset
                : TokenStandard.NonFungible,

        // if Helius shows a collection in groupings for a cNFT then it's verified
        collection: coll ? { key: new PublicKey(coll), verified: true } : null,
        uses: uses
            ? {
                  useMethod:
                      uses.use_method.toLowerCase() === "burn"
                          ? 0
                          : uses.use_method.toLowerCase() === "multiple"
                          ? 1
                          : 2,
                  remaining: uses.remaining,
                  total: uses.total,
              }
            : null,

        // currently always Original (Token2022 not supported yet)
        tokenProgramVersion: 0,
    };
    const originalMetadata = { ...metadataArgs };
    const sellerFeeBasisPointsBuffer = new BN(royalty.basis_points).toBuffer("le", 2);

    // hash function on top of candidate metaHash to compare against data_hash
    const makeDataHash = (metadataArgs: any) =>
        Buffer.from(
            keccak_256.digest(
                Buffer.concat([
                    new PublicKey(computeMetadataArgsHash(metadataArgs)).toBuffer(),
                    sellerFeeBasisPointsBuffer,
                ])
            )
        );

    // try original metadataArgs
    var hash = makeDataHash(metadataArgs);
    if (hash.equals(dataHashBuffer)) {
        console.log("Original metadataArgs match data_hash");
        return {
            metaHash: computeMetadataArgsHash(metadataArgs),
            dataHash: hash,
            metadataArgs: metadataArgs,
        };
    } else {
        console.log("Original metadataArgs don't match data_hash");
    }

    // try tokenStandard = null
    // @ts-ignore
    metadataArgs.tokenStandard = null;
    hash = makeDataHash(metadataArgs);
    if (hash.equals(dataHashBuffer)) {
        console.log("metadataArgs with tokenStandard=null match data_hash");
        return {
            metaHash: computeMetadataArgsHash(metadataArgs),
            dataHash: hash,
            metadataArgs: metadataArgs,
        };
    } else {
        console.log("metadataArgs with tokenStandard=null don't match data_hash");
    }

    // try name + uri = "", tokenStandard = null
    metadataArgs.name = "";
    metadataArgs.uri = "";
    hash = makeDataHash(metadataArgs);
    if (hash.equals(dataHashBuffer)) {
        console.log('metadataArgs with name + uri = "", tokenStandard=null match data_hash');
        return {
            metaHash: computeMetadataArgsHash(metadataArgs),
            dataHash: hash,
            metadataArgs: metadataArgs,
        };
    } else {
        console.log('metadataArgs with name + uri = "", tokenStandard=null don\'t match data_hash');
    }

    // try name + uri = "", tokenStandard = 0
    metadataArgs.tokenStandard = 0;
    hash = makeDataHash(metadataArgs);
    if (hash.equals(dataHashBuffer)) {
        console.log('metadataArgs with name + uri = "", tokenStandard=0 match data_hash');
        return {
            metaHash: computeMetadataArgsHash(metadataArgs),
            dataHash: hash,
            metadataArgs: metadataArgs,
        };
    } else {
        console.log('metadataArgs with name + uri = "", tokenStandard=0 don\'t match data_hash');
    }

    // try reversing creators
    metadataArgs.creators.reverse();
    metadataArgs.name = originalMetadata.name;
    metadataArgs.uri = originalMetadata.uri;
    metadataArgs.tokenStandard = originalMetadata.tokenStandard;
    hash = makeDataHash(metadataArgs);
    if (hash.equals(dataHashBuffer)) {
        console.log("reversing creators worked");
        return {
            metaHash: computeMetadataArgsHash(metadataArgs),
            dataHash: hash,
            metadataArgs: metadataArgs,
        };
    } else {
        console.log("reversing creators didn't work");
    }

    // can't match - return null
    return null;
}

export function hashLeaf({
    leafAssetId,
    leafIndex,
    metadataHash,
    creatorHash,
    owner,
    delegateAddress,
    nftVersionNb,
}: {
    owner: PublicKey;
    delegateAddress?: PublicKey;
    leafIndex: number;
    metadataHash: Buffer;
    nftVersionNb?: number;
    leafAssetId: PublicKey;
    creatorHash: Buffer;
}): Uint8Array {
    const delegate = delegateAddress ?? owner;
    const nftVersion = nftVersionNb ?? 1;
    // console.log("leafIndex", leafIndex);

    return hash([
        u8().serialize(nftVersion),
        publicKey().serialize(leafAssetId),
        publicKey().serialize(owner),
        publicKey().serialize(delegate),
        u64().serialize(BigInt(leafIndex)),
        Uint8Array.from(metadataHash),
        Uint8Array.from(creatorHash),
    ]);
}

function hash(input: Uint8Array | Uint8Array[]): Uint8Array {
    return hashb(Array.isArray(input) ? input : [input]);
    // return bubbleHash(Array.isArray(input) ? mergeBytes(input) : input);
}
export async function recalculateRoot({
    owner,
    tokenId,
    creatorHash,
    dataHash,
    fullproof,
    index,
}: {
    tokenId: string;
    owner: string;
    connection: Connection;
    index: number;
    dataHash: string;

    creatorHash: string;
    fullproof: string[];
}) {
    let leafHash = hashLeaf({
        leafAssetId: new PublicKey(tokenId),
        leafIndex: index,
        metadataHash: decode(dataHash),
        owner: new PublicKey(owner),
        creatorHash: decode(creatorHash),
    });

    let root = getRoot(bs58.encode(leafHash), fullproof, index);

    return {
        root: Array.from(bs58.decode(root)),
        leafHash: Array.from(leafHash),
    };
}

export const getHash = (data: string): string => {
    return createHash("sha256").update(data.toString()).digest("hex");
};

export const makeRoot = (arr: Array<MerkleNode>): MerkleNode => {
    if (arr.length === 1) return arr[1];
    const list = [];
    const length = arr.length;
    for (let i = 1; i < length; i += 2) {
        const currentItem = arr[i];
        if (i + 1 >= length) {
            list.push(currentItem);
            break;
        }
        const nextItem = arr[i + 1];
        let value = currentItem.value + nextItem.value;
        const node = new MerkleNode(getHash(value), currentItem, nextItem);
        list.push(node);
    }
    return makeRoot(list);
};

class MerkleNode {
    value: string;
    left: MerkleNode | null;
    right: MerkleNode | null;
    constructor(value: string, left: MerkleNode | null = null, right: MerkleNode | null = null) {
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

function leafPath(index: number, depth: number) {
    return index.toString(2).padStart(depth, "0").split("").reverse().join("");
}

export function hashv(a: string, b: string) {
    return bs58.encode(
        Buffer.from(
            keccak_256.digest(
                Buffer.concat([new PublicKey(a).toBuffer(), new PublicKey(b).toBuffer()])
            )
        )
    );
}
export function hashb(a: Uint8Array[]) {
    return Uint8Array.from(keccak_256.digest(Buffer.concat(a)));
}
export function getRoot(leaf: string, proof: string[], leafIndex: number) {
    let depth = proof.length;
    let path = leafPath(leafIndex, depth);
    // console.log(leafIndex, "path", path);

    let root = leaf;
    for (let i = 0; i < depth; i++) {
        if (path[i] === "0") {
            root = hashv(root, proof[i]);
        } else {
            root = hashv(proof[i], root);
        }
        // console.log(i, path[i], "proof", proof[i], "root", root);
    }

    return root;
}
