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
    let { clusterOrUrl, program, prioritizationFee, programId, idl } = Data;

    if (program && clusterOrUrl) {
    } else if (!program && clusterOrUrl) {
        program = await getProgram({ clusterOrUrl: clusterOrUrl, programId, idl });
    } else if (!clusterOrUrl && program) {
        clusterOrUrl = program.provider.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }
    console.log(programId, " VS ", program.programId.toString());

    programId = program.programId.toString();

    return {
        program,
        clusterOrUrl,
        connection: program.provider.connection,
        prioritizationFee,
        programId,
        idl: program.idl,
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
    let { bid, nftMintTaker, swapDataAccount, taker } = Data;
    taker = typeof taker === "string" ? taker : taker.publicKey.toString();
    return { bid, nftMintTaker, swapDataAccount, taker };
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
export function isRmBids(Data: Act): Data is RmBidArgs {
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
    if (isRmBids(Data)) return "RmBidArgs";
    return "unknown";
}
