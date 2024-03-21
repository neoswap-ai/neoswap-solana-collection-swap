import { Connection, Keypair } from "@solana/web3.js";
import {
    CEnvOpts,
    COptionSend,
    EnvOpts,
    ErrorFeedback,
    MakeSArg,
    OptionSend,
    TakeSArg,
} from "./types";
import { getProgram } from "./getProgram.obj";

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

export function checkEnvOpts(Data: EnvOpts): CEnvOpts {
    let { clusterOrUrl, program } = Data;

    if (program && clusterOrUrl) {
    } else if (!program && clusterOrUrl) {
        program = getProgram({ clusterOrUrl: clusterOrUrl });
    } else if (!clusterOrUrl && program) {
        clusterOrUrl = program.provider.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }

    return { program, clusterOrUrl };
}

export function getMakeArgs(
    Data: OptionSend &
        Omit<MakeSArg, "maker"> & {
            maker: Keypair;
        }
): MakeSArg {
    let { bid, endDate, maker: makerK, nftMintMaker, paymentMint } = Data;
    let maker = makerK.publicKey.toString();
    return { bid, endDate, maker, nftMintMaker, paymentMint };
}

export function getTakeArgs(
    Data: OptionSend &
        Omit<TakeSArg, "taker"> & {
            taker: Keypair;
        }
): TakeSArg {
    let { bid, nftMintTaker, swapDataAccount, taker } = Data;
    return { bid, nftMintTaker, swapDataAccount, taker: taker.publicKey.toString() };
}
