import { decode, encode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";
import {
    DasApiAsset,
    GetAssetProofRpcResponse,
} from "@metaplex-foundation/digital-asset-standard-api";
import {
    Creator,
    LeafSchema,
    MetadataArgs,
    TokenProgramVersion,
    TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import { ConcurrentMerkleTreeAccount, MerkleTreeProof } from "@solana/spl-account-compression";
import { AccountMeta, Cluster, clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { computeMetadataArgsHash } from "@tensor-hq/tensor-common";
import BN from "bn.js";
import { keccak_256 } from "js-sha3";
import { keccak_256 as bubbleHash } from "@noble/hashes/sha3";

import { createHash } from "crypto";
import {
    CreatorArgs,
    getCreatorSerializer,
    getHashablePluginSchemaSerializer,
} from "@metaplex-foundation/mpl-core";
import {
    array,
    bool,
    mapSerializer,
    mergeBytes,
    option,
    publicKey,
    scalarEnum,
    Serializer,
    string,
    struct,
    u16,
    u64,
    u8,
    publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";
import { none, OptionOrNullable, some, Option } from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export async function getCompNFTData(Data: {
    tokenId: string;
    cluster: Cluster;
    connection?: Connection;
    newOwner?: string;
}) {
    let treeData = await retrieveDASAssetFields(Data.tokenId);
    console.log("treeData", treeData);
    let treeProof = await retrieveDASProofFields(Data.tokenId);
    console.log("treeProof", treeProof);

    const connection = Data.connection || new Connection(clusterApiUrl(Data.cluster));

    // retrieve the merkle tree's account from the blockchain
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
        connection,
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
    // console.log('treeData.creator_hash', treeData.compression);

    // let instructions = [];
    let root = Array.from(treeAccount.getCurrentRoot()); //decode(treeProof.root));
    console.log(bs58.encode(Array.from(decode(treeProof.root))), " VS root", bs58.encode(root));

    let dataHash = Array.from(decode(treeData.compression.data_hash)); //new PublicKey().toBytes();
    let creatorHash = Array.from(decode(treeData.compression.creator_hash));
    let nonce = new BN(treeData.compression.leaf_id);
    let index = Number(treeData.compression.leaf_id);
    let collection = treeData.grouping.find(
        (v: { group_key: string; group_value: string }) => v.group_key === "collection"
    )!.group_value;

    let metadata = (await constructMetaHash(Data.tokenId))?.metadataArgs!;
    treeData.ownership.owner;
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
        owner: treeData.ownership.owner.toString(),
        leafHash: treeProof.leaf.toString(),
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
    console.log("treeData Results", treeData);
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
    leafIndex: number | bigint;
    metadataHash: Buffer;
    nftVersionNb?: number;
    leafAssetId: PublicKey;
    creatorHash: Buffer;
}): Uint8Array {
    const delegate = delegateAddress ?? owner;
    const nftVersion = nftVersionNb ?? 1;

    return hash([
        u8().serialize(nftVersion),
        publicKey().serialize(leafAssetId),
        publicKey().serialize(owner),
        publicKey().serialize(delegate),
        u64().serialize(leafIndex),
        metadataHash,
        creatorHash,
    ]);
}

function hash(input: Uint8Array | Uint8Array[]): Uint8Array {
    return bubbleHash(Array.isArray(input) ? mergeBytes(input) : input);
}
export async function recalculateRoot({
    newOwner,
    tokenId,
    connection,
}: {
    tokenId: string;
    newOwner: string;
    connection: Connection;
}) {
    // let treeData = await retrieveDASAssetFields(tokenId);
    // let treeProof = await retrieveDASProofFields(tokenId);
    let compData = await getCompNFTData({ cluster: "mainnet-beta", tokenId, connection }); // let metaData = constructMetaHash(tokenId);
    // let leafData: LeafSchema = {
    //     __kind: "V1",
    //     creatorHash: Array.from(Buffer.from(treeData.compression.creator_hash)),
    //     dataHash: Array.from(Buffer.from(treeData.compression.data_hash)),
    //     delegate: new PublicKey(treeData.ownership.owner),
    //     id: new PublicKey(treeData.id),
    //     nonce: new BN(treeData.compression.leaf_id),
    //     owner: new PublicKey(newOwner),
    // };
    // let leafData: LeafSchema = {
    //     __kind: "V1",
    //     creatorHash: compData.creatorHash,
    //     dataHash: compData.dataHash,
    //     delegate: new PublicKey(newOwner),
    //     id: new PublicKey(tokenId),
    //     nonce: compData.nonce,
    //     owner: new PublicKey(newOwner),
    // };
    // if (Data.newOwner) {
    console.log("compData", compData);
    // hashLeaf(context, {
    //     merkleTree,
    //     owner: publicKey(leafOwner, false),
    //     delegate: publicKey(input.leafDelegate ?? leafOwner, false),
    //     leafIndex,
    //     metadata,
    //   })
    let leafhash = hashLeaf({
        leafAssetId: new PublicKey(tokenId),
        leafIndex: compData.index,
        metadataHash: Buffer.from(compData.dataHash),
        owner: new PublicKey(newOwner),
        creatorHash: Buffer.from(compData.creatorHash),
        // delegateAddress,
        // nftVersionNb: 1,
    });
    console.log(compData.leafHash, "leafhash", bs58.encode(leafhash));

    let rootHash = getRoot(
        // bs58.encode(leafhash),
        compData.leafHash,
        compData.proofMeta.map((v) => v.pubkey.toString()),
        compData.index
    );
    console.log(bs58.encode(compData.root), "V root S", rootHash);
    //   }
}

// function hashData(){
//     Buffer.from(
//         keccak_256.digest(
//             Buffer.concat([
//                 new PublicKey().toBuffer(),
//                 sellerFeeBasisPointsBuffer,
//             ])
//         )
//     );
// }

export const getHash = (data: string): string => {
    return createHash("sha256").update(data.toString()).digest("hex");
};

export const makeRoot = (arr: Array<MerkleNode>): MerkleNode => {
    if (arr.length === 1) return arr[0];
    const list = [];
    const length = arr.length;
    for (let i = 0; i < length; i += 2) {
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

function hashv(a: string, b: string) {
    return bs58.encode(
        Buffer.from(
            keccak_256.digest(
                Buffer.concat([new PublicKey(a).toBuffer(), new PublicKey(b).toBuffer()])
            )
        )
    );
}

function getRoot(leaf: string, proof: string[], leafIndex: number) {
    let depth = proof.length;
    let path = leafPath(leafIndex, depth);
    console.log(leafIndex, "path", path);

    let root = leaf;
    for (let i = 0; i < depth; i++) {
        if (path[i] === "0") {
            root = hashv(root, proof[i]);
        } else {
            root = hashv(proof[i], root);
        }
    }

    return root;
}

// //@ts-ignore
// export function getMetadataArgsSerializer(): Serializer<MetadataArgsArgs, MetadataArgs> {
//     return mapSerializer<MetadataArgsArgs, any, MetadataArgs>(
//         //@ts-ignore
//         struct<MetadataArgs>(
//             [
//                 ["name", string()],
//                 ["symbol", string()],
//                 ["uri", string()],
//                 ["sellerFeeBasisPoints", u16()],
//                 ["primarySaleHappened", bool()],
//                 ["isMutable", bool()],
//                 //@ts-ignore
//                 ["editionNonce", option(u8())],
//                 //@ts-ignore
//                 ["tokenStandard", option(getTokenStandardSerializer())],
//                 //@ts-ignore
//                 ["collection", option(getCollectionSerializer())],
//                 //@ts-ignore
//                 ["uses", option(getUsesSerializer())],
//                 ["tokenProgramVersion", getTokenProgramVersionSerializer()],
//                 //@ts-ignore
//                 ["creators", array(getCreatorSerializer())],
//             ],
//             { description: "MetadataArgs" }
//         ),
//         (value) => ({
//             ...value,
//             symbol: value.symbol ?? "",
//             primarySaleHappened: value.primarySaleHappened ?? false,
//             isMutable: value.isMutable ?? true,
//             editionNonce: value.editionNonce ?? none(),
//             tokenStandard: value.tokenStandard ?? some(TokenStandard.NonFungible),
//             uses: value.uses ?? none(),
//             tokenProgramVersion: value.tokenProgramVersion ?? TokenProgramVersion.Original,
//         })
//         //@ts-ignore
//     ) as Serializer<MetadataArgsArgs, MetadataArgs>;
// }

// export type TokenStandardArgs = TokenStandard;

// export function getTokenStandardSerializer(): Serializer<TokenStandardArgs, TokenStandard> {
//     return scalarEnum<TokenStandard>(TokenStandard, {
//         description: "TokenStandard",
//     }) as Serializer<TokenStandardArgs, TokenStandard>;
// }
// export type Collection = { verified: boolean; key: PublicKey };

// export type CollectionArgs = Collection;

// export function getCollectionSerializer(): Serializer<CollectionArgs, Collection> {
//     return struct<Collection>(
//         [
//             ["verified", bool()],
//             //@ts-ignore
//             ["key", publicKey()],
//         ],
//         { description: "Collection" }
//     ) as Serializer<CollectionArgs, Collection>;
// }

// export type Uses = { useMethod: UseMethod; remaining: bigint; total: bigint };

// export type UsesArgs = {
//     useMethod: UseMethodArgs;
//     remaining: number | bigint;
//     total: number | bigint;
// };

// export function getUsesSerializer(): Serializer<UsesArgs, Uses> {
//     return struct<Uses>(
//         [
//             ["useMethod", getUseMethodSerializer()],
//             ["remaining", u64()],
//             ["total", u64()],
//         ],
//         { description: "Uses" }
//     ) as Serializer<UsesArgs, Uses>;
// }
// export enum UseMethod {
//     Burn,
//     Multiple,
//     Single,
// }

// export type UseMethodArgs = UseMethod;

// export function getUseMethodSerializer(): Serializer<UseMethodArgs, UseMethod> {
//     return scalarEnum<UseMethod>(UseMethod, {
//         description: "UseMethod",
//     }) as Serializer<UseMethodArgs, UseMethod>;
// }

// export type TokenProgramVersionArgs = TokenProgramVersion;

// export function getTokenProgramVersionSerializer(): Serializer<
//     TokenProgramVersionArgs,
//     TokenProgramVersion
// > {
//     return scalarEnum<TokenProgramVersion>(TokenProgramVersion, {
//         description: "TokenProgramVersion",
//     }) as Serializer<TokenProgramVersionArgs, TokenProgramVersion>;
// }

// export type MetadataArgs = {
//     /** The name of the asset */
//     name: string;
//     /** The symbol for the asset */
//     symbol: string;
//     /** URI pointing to JSON representing the asset */
//     uri: string;
//     /** Royalty basis points that goes to creators in secondary sales (0-10000) */
//     sellerFeeBasisPoints: number;
//     primarySaleHappened: boolean;
//     isMutable: boolean;
//     /** nonce for easy calculation of editions, if present */
//     editionNonce: Option<number>;
//     /** Since we cannot easily change Metadata, we add the new DataV2 fields here at the end. */
//     tokenStandard: Option<TokenStandard>;
//     /** Collection */
//     collection: Option<Collection>;
//     /** Uses */
//     uses: Option<Uses>;
//     tokenProgramVersion: TokenProgramVersion;
//     creators: Array<Creator>;
// };

// export type MetadataArgsArgs = {
//     /** The name of the asset */
//     name: string;
//     /** The symbol for the asset */
//     symbol?: string;
//     /** URI pointing to JSON representing the asset */
//     uri: string;
//     /** Royalty basis points that goes to creators in secondary sales (0-10000) */
//     sellerFeeBasisPoints: number;
//     primarySaleHappened?: boolean;
//     isMutable?: boolean;
//     /** nonce for easy calculation of editions, if present */
//     editionNonce?: OptionOrNullable<number>;
//     /** Since we cannot easily change Metadata, we add the new DataV2 fields here at the end. */
//     tokenStandard?: OptionOrNullable<TokenStandardArgs>;
//     /** Collection */
//     collection: OptionOrNullable<CollectionArgs>;
//     /** Uses */
//     uses?: OptionOrNullable<UsesArgs>;
//     tokenProgramVersion?: TokenProgramVersionArgs;
//     creators: Array<CreatorArgs>;
// };

// function hashMetadata(metadata: MetadataArgsArgs): Uint8Array {
//     return mergeBytes([hashMetadataData(metadata), hashMetadataCreators(metadata.creators)]);
// }

// function hashMetadataData(metadata: MetadataArgsArgs): Uint8Array {
//     return hash([
//         hash(getMetadataArgsSerializer().serialize(metadata)),
//         u16().serialize(metadata.sellerFeeBasisPoints),
//     ]);
// }

// function hashMetadataCreators(creators: MetadataArgsArgs["creators"]): Uint8Array {
//     return hash(array(getCreatorSerializer(), { size: "remainder" }).serialize(creators));
// }
