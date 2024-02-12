import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getDepositNftInstruction } from "./subFunction/deposit.nft.instructions";
import { getDepositSolInstruction } from "./subFunction/deposit.sol.instructions";
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
import { getDepositCNftInstruction } from "./subFunction/deposit.cnft.instructions";
import { BN, Program } from "@coral-xyz/anchor";
import { swapDataConverter } from "../utils/swapDataConverter.function";

export async function createDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    signer: PublicKey;
    clusterOrUrl?: Cluster | string;
    program?: Program;
    swapInfo?: SwapInfo;
}): Promise<TxWithSigner[]> {
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
    // let force = false;
    if (swapInfo) {
        console.log("swapInfo", swapInfo);

        // force = true;
        swapIdentityInfo = await swapDataConverter({
            swapInfo,
            connection: Data.program.provider.connection,
            clusterOrUrl: Data.clusterOrUrl,
            swapDataAccount: Data.swapDataAccount,
        });
        swapDataInfo = swapIdentityInfo.swapData;
        swapData = swapDataInfo;
    }
    try {
        swapDataOnchain = await getSwapDataAccountFromPublicKey({
            program,
            swapDataAccount_publicKey: Data.swapDataAccount,
        });
    } catch (error) {
        console.log("getSwapDataAccountFromPublicKey error", error);
    }

    if (swapInfo) {
    } else if (!swapDataOnchain) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (swapDataOnchain.status !== TradeStatus.WaitingToDeposit) {
        // if (Data.swapInfo) return;
        throw {
            blockchain: "solana",
            status: "error",
            message: "Status of the swap isn't in a depositing state.",
            swapStatus: swapDataOnchain.status,
        } as ErrorFeedback;
    } else
        swapIdentityOnchain = getSwapIdentityFromData({
            swapData: swapDataOnchain,
            clusterOrUrl: Data.clusterOrUrl,
        });

    swapIdentity = swapIdentityInfo;
    if (!swapIdentity) swapIdentity = swapIdentityOnchain;
    if (!swapData) swapData = swapDataOnchain;

    if (!swapData) throw "swapData not found";
    if (!swapIdentity) throw "swapIdentity not found";

    console.log("swapData", swapData.tokenItems, swapData.nftItems);
    console.log("swapIdentity seedstring", swapIdentity.swapDataAccount_seedString);
    // console.log("swapIdentity seedstring", swapIdentity.swapDataAccount_seedString);
    // console.log("Data.user", Data.user);
    // swapIdentity.swapDataAccount_publicKey=new PublicKey('GnzPof4D1hwbifZaCtEbLbmmWvsyLfqd8gbYhvR1iXY6')
    let depositInstruction: TxWithSigner[] = [];
    let ataList: string[] = [];
    let isUserPartOfTrade = false;
    let isUserAlreadyDeposited = false;

    let allData = [
        ...swapData.nftItems.filter((item) => !item.mint.equals(SystemProgram.programId)),
        ...swapData.tokenItems.filter((item) => !item.owner.equals(SystemProgram.programId)),
    ];
    console.log("allData", allData);

    let swapDataItems: (TokenSwapItem | NftSwapItem)[] = allData.filter((item) =>
        item.owner.equals(Data.user)
    );
    console.log("swapDataItems", swapDataItems);

    if (swapDataItems.length > 0) isUserPartOfTrade = true;
    for (const swapDataItem of swapDataItems) {
        if ("mint" in swapDataItem) {
            // if (swapDataOnchain)swapDataOnchain.nftItems.find(  (item) =>item.)
            if (swapDataItem.status === ItemStatus.NFTPending) {
                if (swapDataOnchain) {
                    let existItem = swapDataOnchain.nftItems.find(
                        (item) =>
                            item.mint.equals(swapDataItem.mint) &&
                            item.merkleTree.equals(swapDataItem.merkleTree) &&
                            item.destinary.equals(swapDataItem.destinary) &&
                            new BN(item.index).eq(new BN(swapDataItem.index)) &&
                            item.owner.equals(swapDataItem.owner)
                    );
                    console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCl");
                    console.log("swapDataOnchain.nftItems", swapDataOnchain.nftItems);
                    console.log("swapDataItem", swapDataItem);
                    console.log("existItem", existItem);

                    if (existItem && existItem.status === ItemStatus.NFTDeposited) {
                        console.log(
                            " XXX - SKIP Deposit (C)NFT item with TokenId ",
                            swapDataItem.mint.toBase58(),
                            " from ",
                            swapDataItem.owner.toBase58(),
                            " - XXX"
                        );
                        continue;
                    }
                }
                if (swapDataItem.isCompressed) {
                    console.log(
                        "XXX - Deposit CNFT item with TokenId ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );

                    let ix = await getDepositCNftInstruction({
                        program,
                        signer: Data.user,
                        swapIdentity,
                        tokenId: swapDataItem.mint,
                        clusterOrUrl: Data.clusterOrUrl,
                    });
                    if (!ix.instructions) throw " error prepare Instruction";
                    depositInstruction.push({
                        tx: new Transaction().add(ix.instructions),
                    });
                } else {
                    console.log(
                        "XXX - Deposit NFT item with mint ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );

                    let depositing = await getDepositNftInstruction({
                        program: program,
                        signer: Data.user,
                        mint: swapDataItem.mint,
                        amount: swapDataItem.amount.toNumber(),
                        swapIdentity,
                        ataList,
                    });

                    ataList = depositing.ataList;
                    depositInstruction.push({
                        tx: new Transaction().add(...depositing.instructions),
                    });
                }
            } else if (swapDataItem.status === ItemStatus.NFTDeposited) {
                isUserAlreadyDeposited = true;
            }
        } else {
            if (swapDataItem.status === ItemStatus.SolPending) {
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
                if (swapDataOnchain) {
                    let existItem = swapDataOnchain.tokenItems.find(
                        (item) =>
                            new BN(item.amount).eq(new BN(swapDataItem.amount)) &&
                            item.owner.equals(swapDataItem.owner)
                    );
                    console.log("DDDDDDDDDDDDDDDDDDDDDDDDD");
                    console.log("swapDataOnchain.nftItems", swapDataOnchain.tokenItems);
                    console.log("swapDataItem", swapDataItem);
                    console.log("existItem", existItem);

                    if (existItem && existItem.status === ItemStatus.SolDeposited) {
                        console.log(
                            `XXX - SKIP - Deposit ${tokenName} item with mint `,
                            swapData.acceptedPayement.toBase58(),
                            " from ",
                            swapDataItem.owner.toBase58(),
                            " - XXX"
                        );
                        continue;
                    }
                }

                console.log(
                    `XXX - Deposit ${tokenName} item with mint `,
                    swapData.acceptedPayement.toBase58(),
                    " from ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );

                const depositSolInstruction = await getDepositSolInstruction({
                    program: program,
                    signer: Data.user,
                    amount: swapDataItem.amount.toNumber(),
                    swapIdentity,
                    ataList: ataList,
                    mint: swapData.acceptedPayement,
                });
                ataList = depositSolInstruction.newAtas;

                depositInstruction.push({
                    tx: new Transaction().add(...depositSolInstruction.instructions),
                });
            } else if (swapDataItem.status === ItemStatus.SolDeposited) {
                isUserAlreadyDeposited = true;
            }

            // } else {
            //     if (swapDataItem.isNft) {
            //         if (swapDataItem.status === ItemStatus.NFTPendingPresign) {
            //             if (swapDataItem.isCompressed) {
            //                 console.log(
            //                     "XXX - Deposit Presigned CNFT item with TokenId ",
            //                     swapDataItem.mint.toBase58(),
            //                     " from ",
            //                     swapDataItem.owner.toBase58(),
            //                     " - XXX"
            //                 );
            //                 throw "not implemented";
            //                 // let ix = await getDepositCNftPresignedInstruction({
            //                 //     program,
            //                 //     signer: Data.user,
            //                 //     swapIdentity,
            //                 //     tokenId: swapDataItem.mint,
            //                 //     clusterOrUrl: Data.clusterOrUrl,
            //                 // });
            //                 // if (!ix.instructions) throw " error prepare Instruction";
            //                 // depositInstruction.push({
            //                 //     tx: new Transaction().add(ix.instructions),
            //                 // });
            //             } else {
            //                 console.log(
            //                     "XXX - Deposit Presigned NFT item with mint ",
            //                     swapDataItem.mint.toBase58(),
            //                     " from ",
            //                     swapDataItem.owner.toBase58(),
            //                     " - XXX"
            //                 );

            //                 let depositing = await getDepositNftPresignedInstruction({
            //                     program,
            //                     signer: Data.signer,
            //                     mint: swapDataItem.mint,
            //                     user: swapDataItem.owner,
            //                     swapIdentity,
            //                     ataList,
            //                 });

            //                 ataList = depositing.ataList;
            //                 depositInstruction.push({
            //                     tx: new Transaction().add(...depositing.instruction),
            //                 });
            //             }
            //         } else if (swapDataItem.status === ItemStatus.NFTDeposited) {
            //             isUserAlreadyDeposited = true;
            //         }
            //     } else {
            //         if (swapDataItem.status === ItemStatus.SolPendingPresign) {
            //             console.log(
            //                 "XXX - Deposit SOL Presigned item with mint ",
            //                 swapDataItem.mint.toBase58(),
            //                 " from ",
            //                 swapDataItem.owner.toBase58(),
            //                 " - XXX"
            //             );

            //             const depositSolInstruction = await getDepositSolPresignedInstruction({
            //                 program: program,
            //                 signer: Data.signer,
            //                 user: Data.user,
            //                 swapIdentity,
            //                 ataList,
            //                 mint: swapDataItem.mint,
            //             });
            //             ataList = depositSolInstruction.ataList;

            //             depositInstruction.push({
            //                 tx: new Transaction().add(...depositSolInstruction.instruction),
            //             });
            //         } else if (swapDataItem.status === ItemStatus.SolDeposited) {
            //             isUserAlreadyDeposited = true;
            //         }
            //     }
        }
    }

    if (isUserPartOfTrade === false) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You are not a part of this swap",
        } as ErrorFeedback;
    } else if (
        depositInstruction.length === 0 &&
        isUserPartOfTrade === true &&
        isUserAlreadyDeposited === true
    ) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have already escrowed your items in this swap",
        } as ErrorFeedback;
    } else if (depositInstruction.length === 0 && isUserPartOfTrade === true) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have no items to escrow in this swap",
        } as ErrorFeedback;
    }
    console.log("found ", depositInstruction.length, " items to deposit");

    return depositInstruction;
}
