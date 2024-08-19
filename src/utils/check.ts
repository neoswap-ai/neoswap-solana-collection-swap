import { Connection, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import {
    Act,
    CEnvOpts,
    COptionSend,
    ClaimSArg,
    EnvOpts,
    ErrorFeedback,
    MakeSArg,
    OptionSend,
    RmBidArgs,
    SetNewTime,
    TakeSArg,
    UpdateSArgs,
} from "./types";
import { getProgram } from "./getProgram.obj";
import { isVersionedTransaction } from "@solana/wallet-adapter-base";
import { CollectionSwap } from "./neoSwap.idl";
import { Program } from "@coral-xyz/anchor";
import { LOOKUP_TABLE_ACCOUNT } from "./const";

export function checkOptionSend(Data: OptionSend): COptionSend {
    let {
        clusterOrUrl,
        commitment,
        connection,
        retryDelay,
        skipConfirmation,
        skipSimulation,
        prioritizationFee,
    } = Data;
    if (!skipSimulation) skipSimulation = false;
    if (!skipConfirmation) skipConfirmation = false;
    if (!commitment) commitment = "confirmed";
    if (!retryDelay) retryDelay = 5000;

    if (connection && clusterOrUrl) {
    } else if (!connection && clusterOrUrl) connection = new Connection(clusterOrUrl);
    else if (!clusterOrUrl && connection) clusterOrUrl = connection.rpcEndpoint;
    else
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or connection is required",
        } as ErrorFeedback;

    return {
        clusterOrUrl,
        commitment,
        connection,
        retryDelay,
        skipConfirmation,
        skipSimulation,
        prioritizationFee,
    };
}

export async function checkEnvOpts(Data: EnvOpts): Promise<CEnvOpts> {
    let {
        clusterOrUrl,
        program: anyProgram,
        prioritizationFee,
        programId,
        idl,
        lookUpTableAccount: lUT,
    } = Data;
    let program: Program<CollectionSwap>; //= anyProgram as any as Program<CollectionSwap>|undefined;
    if (anyProgram && clusterOrUrl) {
        program = anyProgram as any as Program<CollectionSwap>;
    } else if (!anyProgram && clusterOrUrl) {
        // console.log("programId", programId);

        program = await getProgram({ clusterOrUrl: clusterOrUrl, programId, idl });
    } else if (!clusterOrUrl && anyProgram) {
        program = anyProgram as any as Program<CollectionSwap>;
        clusterOrUrl = program.provider.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }
    programId = program.programId.toString();
    // console.log(programId);
    console.log("lookUpTableAccount LUT", lUT === false, lUT === undefined, lUT);

    let lookUpTableAccount: string | false = LOOKUP_TABLE_ACCOUNT;
    if (lUT === false) lookUpTableAccount = false;
    else if (lUT === undefined) lookUpTableAccount = LOOKUP_TABLE_ACCOUNT;
    else lookUpTableAccount = lUT;

    return {
        program,
        clusterOrUrl,
        connection: program.provider.connection,
        prioritizationFee,
        programId,
        idl: program.idl,
        lookUpTableAccount,
    };
}
export function getMakeArgs(
    Data: any &
        (
            | MakeSArg
            | (Omit<MakeSArg, "maker"> & {
                  maker: Keypair;
              })
        )
): MakeSArg {
    let { bids, endDate, maker, nftMintMaker, paymentMint } = Data;
    maker = typeof maker === "string" ? maker : maker.publicKey.toString();

    return { bids, endDate, maker, nftMintMaker, paymentMint };
}

export function getTakeArgs(
    Data: any &
        (
            | TakeSArg
            | (Omit<TakeSArg, "taker"> & {
                  taker: Keypair;
              })
        )
): TakeSArg {
    let {
        bid,
        nftMintTaker,
        swapDataAccount,
        taker,
        verifyTaker,
        signer,
        n,
        unwrap,
        traitIndex,
        traitProofs,
    } = Data;
    taker = typeof taker === "string" ? taker : taker.publicKey.toString();
    return {
        bid,
        nftMintTaker,
        swapDataAccount,
        taker,
        verifyTaker,
        signer,
        n,
        unwrap,
        traitIndex,
        traitProofs,
    };
}
export function getClaimSArgs(
    Data: any &
        (
            | ClaimSArg
            | (Omit<ClaimSArg, "signer"> & {
                  signer: Keypair;
              })
        )
): ClaimSArg {
    let { signer, swapDataAccount } = Data;
    signer = typeof signer === "string" ? signer : signer.publicKey.toString();
    return { swapDataAccount, signer };
}

export function isVersionedArray(
    txs: Transaction[] | VersionedTransaction[]
): txs is VersionedTransaction[] {
    if (txs.length === 0) return false;
    return isVersionedTransaction(txs[0]);
}

export function isMakeSArg(Data: Act): Data is MakeSArg {
    if (
        "endDate" in Data &&
        "maker" in Data &&
        "nftMintMaker" in Data &&
        "paymentMint" in Data &&
        "bids" in Data
    ) {
        return true;
    } else {
        return false;
    }
}

export function isTakeSArg(Data: Act): Data is TakeSArg {
    if ("taker" in Data && "bid" in Data && "nftMintTaker" in Data && "swapDataAccount" in Data) {
        return true;
    } else {
        return false;
    }
}
export function isClaimSArg(Data: Act): Data is ClaimSArg {
    if ("swapDataAccount" in Data && "signer" in Data) {
        return true;
    } else {
        return false;
    }
}

export function isUpdateSArg(Data: Act): Data is UpdateSArgs {
    if ("bids" in Data && "swapDataAccount" in Data && "maker" in Data) {
        return true;
    } else {
        return false;
    }
}
export function isSetNewTime(Data: Act): Data is SetNewTime {
    if ("newTime" in Data && "swapDataAccount" in Data && "maker" in Data) {
        return true;
    } else {
        return false;
    }
}
export function isRmBidsArgs(Data: Act): Data is RmBidArgs {
    if ("rmBids" in Data && "swapDataAccount" in Data && "maker" in Data) {
        return true;
    } else {
        return false;
    }
}

export function whatIs(
    Data: Act
): "MakeSArg" | "TakeSArg" | "ClaimSArg" | "UpdateSArgs" | "SetNewTime" | "RmBidArgs" | "unknown" {
    if (isMakeSArg(Data)) return "MakeSArg";
    if (isTakeSArg(Data)) return "TakeSArg";
    if (isClaimSArg(Data)) return "ClaimSArg";
    if (isUpdateSArg(Data)) return "UpdateSArgs";
    if (isSetNewTime(Data)) return "SetNewTime";
    if (isRmBidsArgs(Data)) return "RmBidArgs";
    return "unknown";
}
