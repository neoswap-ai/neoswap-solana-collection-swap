import { Connection, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import {
    CEnvOpts,
    COptionSend,
    ClaimArg,
    EnvOpts,
    ErrorFeedback,
    MakeSArg,
    OptionSend,
    TakeSArg,
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
export function getClaimArgs(
    Data: any &
        (
            | ClaimArg
            | (Omit<ClaimArg, "signer"> & {
                  signer: Keypair;
              })
        )
): ClaimArg {
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
