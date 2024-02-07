import { Cluster, PublicKey } from "@solana/web3.js";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "../utils/const";

export function getAdminPda(Data: { cluster?: Cluster; programId?: PublicKey }) {
    let pid = NEOSWAP_PROGRAM_ID;
    if (!!Data.programId) {
        pid = Data.programId;
    } else if (!!Data.cluster) {
        pid = Data.cluster == "mainnet-beta" ? NEOSWAP_PROGRAM_ID : NEOSWAP_PROGRAM_ID_DEV;
    }
    return PublicKey.findProgramAddressSync([Buffer.from("admin")], pid)[0];
}

export function getCollectionPda(Data: {
    collection: PublicKey;
    cluster?: Cluster;
    programId?: PublicKey;
}) {
    let pid = NEOSWAP_PROGRAM_ID;
    if (!!Data.programId) {
        pid = Data.programId;
    } else if (!!Data.cluster) {
        pid = Data.cluster == "mainnet-beta" ? NEOSWAP_PROGRAM_ID : NEOSWAP_PROGRAM_ID_DEV;
    }
    return PublicKey.findProgramAddressSync([Data.collection.toBuffer()], pid)[0];
}
