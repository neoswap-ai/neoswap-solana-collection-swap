import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getClaimNftInstructions } from "./subFunction/claim.nft.instructions";
import { getClaimSolInstructions } from "./subFunction/claim.sol.instructions";
import {
    ErrorFeedback,
    ItemStatus,
    NftSwapItem,
    SwapData,
    SwapIdentity,
    SwapInfo,
    TokenSwapItem,
    TradeStatus,
    TxWithSigner,
} from "../utils/types";
import { getClaimCNftInstruction } from "./subFunction/claim.cnft.instructions";
import { Program } from "@coral-xyz/anchor";
import { swapDataConverter } from "../utils/swapDataConverter.function";

export async function createClaimSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl?: Cluster | string;
    swapInfo?: SwapInfo;
    program?: Program;
}): Promise<TxWithSigner[] | undefined> {
    if (Data.program && Data.clusterOrUrl) {
    } else if (!Data.program && Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else if (!Data.clusterOrUrl && Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else {
        throw {
            blockchain: "solana",
            status: "error",
            message: "clusterOrUrl or program is required",
        } as ErrorFeedback;
    }

    const program = Data.program;

    let swapData: SwapData | undefined;
    let swapDataInfo: SwapData | undefined;
    let swapDataOnchain: SwapData | undefined;

    let swapIdentity: SwapIdentity | undefined;
    let swapIdentityInfo: SwapIdentity | undefined;
    let swapIdentityOnchain: SwapIdentity | undefined;

    let swapInfo: SwapInfo | undefined = Data.swapInfo;
    let force = false;
    let init = false;

    if (swapInfo) {
        force = true;
        swapIdentityInfo = await swapDataConverter({
            swapInfo,
            connection: Data.program.provider.connection,
            clusterOrUrl: Data.clusterOrUrl,
            swapDataAccount: Data.swapDataAccount,
        });
        swapDataInfo = swapIdentityInfo.swapData;
        swapData = swapDataInfo;
        init = true;
    }

    swapDataOnchain = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });

    swapDataOnchain = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });

    if (!swapDataOnchain) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (
        !(
            swapDataOnchain.status === TradeStatus.WaitingToClaim ||
            swapDataOnchain.status === TradeStatus.WaitingToDeposit
        )
    ) {
        // if (Data.swapInfo) return;
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap is't in the adequate status for Validate Claim.",
            swapStatus: swapDataOnchain.status,
        } as ErrorFeedback;
    }

    swapIdentityOnchain = getSwapIdentityFromData({
        swapData: swapDataOnchain,
        clusterOrUrl: Data.clusterOrUrl,
    });

    if (!swapIdentity) swapIdentity = swapIdentityOnchain;
    if (!swapData) swapData = swapDataOnchain;

    if (swapData.initializer.equals(Data.signer)) {
        init = true;
    }

    let claimTransactionInstruction: TxWithSigner[] = [];
    let ataList: PublicKey[] = [];
    let allData: (NftSwapItem | TokenSwapItem)[] = [...swapData.nftItems, ...swapData.tokenItems];

    let swapDataItems = force
        ? allData
        : allData.filter(
              (swapDataItem) =>
                  swapDataItem.status === ItemStatus.NFTDeposited ||
                  swapDataItem.status === ItemStatus.SolToClaim
          );

    if (!init) {
        console.log("filtering items for ", Data.signer.toBase58());
        swapDataItems = swapDataItems.filter((item) => {
            if ("mint" in item) {
                return item.destinary.equals(Data.signer);
            } else {
                return item.owner.equals(Data.signer);
            }
        });
    }
    console.log("swapDataOnchain", swapDataOnchain);
    console.log("swapDataItems", swapDataItems);
    for (const swapDataItem of swapDataItems) {
        if (
            init === true ||
            ("mint" in swapDataItem && swapDataItem.destinary.equals(Data.signer)) ||
            (!("mint" in swapDataItem) && swapDataItem.owner.equals(Data.signer))
        ) {
            if ("mint" in swapDataItem) {
                console.log("NftSwapItem XXX", swapDataItem);
                let isInSwap = false;

                if (!!force) {
                    let existItem = swapDataOnchain.nftItems.find((item) => {
                        console.log("item", item);

                        return (
                            item.mint.equals(swapDataItem.mint) &&
                            item.merkleTree.equals(swapDataItem.merkleTree) &&
                            item.destinary.equals(swapDataItem.destinary) &&
                            (swapDataItem.isCompressed
                                ? item.index.eq(swapDataItem.index)
                                : true) &&
                            item.owner.equals(swapDataItem.owner)
                        );
                    });
                    console.log("existItem", existItem);
                    
                    if (existItem && existItem.status !== ItemStatus.NFTDeposited) {
                        console.log(
                            " XXX - SKIP Claim (C)NFT item with TokenId ",
                            swapDataItem.mint.toBase58(),
                            " from ",
                            swapDataItem.owner.toBase58(),
                            " - XXX"
                        );
                        continue;
                    } else isInSwap = true;
                }
                if (swapDataItem.status === ItemStatus.NFTDeposited || isInSwap) {
                    if (swapDataItem.isCompressed) {
                        console.log(
                            "XXX - Claim CNFT swapDataItem with TokenId ",
                            swapDataItem.mint.toBase58(),
                            " to ",
                            swapDataItem.destinary.toBase58(),
                            " - XXX"
                        );

                        const claimNftData = await getClaimCNftInstruction({
                            program,
                            user: swapDataItem.destinary,
                            tokenId: swapDataItem.mint,
                            signer: Data.signer,
                            swapIdentity,
                            clusterOrUrl: Data.clusterOrUrl,
                            // ataList,
                        });
                        claimTransactionInstruction.push({
                            tx: new Transaction().add(claimNftData),
                        });
                    } else {
                        console.log(
                            "XXX - Claim NFT swapDataItem with mint ",
                            swapDataItem.mint.toBase58(),
                            " to ",
                            swapDataItem.destinary.toBase58(),
                            " - XXX"
                        );
                        const claimNftData = await getClaimNftInstructions({
                            program,
                            destinary: swapDataItem.destinary,
                            mint: swapDataItem.mint,
                            signer: Data.signer,
                            swapIdentity,
                            ataList,
                        });

                        claimTransactionInstruction.push({
                            tx: new Transaction().add(...claimNftData.instruction),
                        });
                        claimNftData.newAtas.forEach((ata) => {
                            if (!ataList.includes(ata)) ataList.push(ata);
                        });
                    }
                }
            } else {
                let tokenName = "SOL";
                switch (swapData.acceptedPayement.toString()) {
                    case "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v":
                        tokenName = "USCD";
                        break;
                    case "ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx":
                        tokenName = "ATLAS";
                        break;
                    case "6dhTynDkYsVM7cbF7TKfC9DWB636TcEM935fq7JzL2ES":
                        tokenName = "BONK";
                        break;
                    case "GENEtH5amGSi8kHAtQoezp1XEXwZJ8vcuePYnXdKrMYz":
                        tokenName = "GENOPETS";
                        break;
                }

                if (!!force) {
                    let existItem = swapDataOnchain.tokenItems.find(
                        (item) =>
                            item.amount.eq(swapDataItem.amount) &&
                            item.owner.equals(swapDataItem.owner)
                    );

                    if (existItem && existItem.status !== ItemStatus.SolToClaim) {
                        console.log(
                            `XXX - SKIP - Claim ${tokenName} item with mint `,
                            swapData.acceptedPayement.toBase58(),
                            " from ",
                            swapDataItem.owner.toBase58(),
                            " - XXX"
                        );
                        continue;
                    }
                }
                console.log(
                    `XXX - Claim ${tokenName} item mint `,
                    swapData.acceptedPayement.toBase58(),
                    "to ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );
                const claimSolData = await getClaimSolInstructions({
                    program: program,
                    user: swapDataItem.owner,
                    signer: Data.signer,
                    swapIdentity,
                    ataList,
                    mint: swapData.acceptedPayement,
                });

                claimTransactionInstruction.push({
                    tx: new Transaction().add(...claimSolData.instructions),
                });
                claimSolData.newAtas.forEach((ata) => {
                    if (!ataList.includes(ata)) ataList.push(ata);
                });
            }
        }
    }
    if (claimTransactionInstruction.length > 0) {
        console.log("found ", claimTransactionInstruction.length, " items to claim");
        return claimTransactionInstruction;
    } else {
        return undefined;
    }
}
