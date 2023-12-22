import { Cluster, PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { prepareDepositNftInstruction } from "./subFunction/deposit.nft.prepareInstructions";
import { prepareDepositSolInstruction } from "./subFunction/deposit.sol.prepareInstructions";
import { ApiProcessorData, ErrorFeedback, ItemStatus, TradeStatus } from "../utils/types";
import { getDepositCNftInstruction } from "./subFunction/deposit.cnft.instructions";
import { Program } from "@coral-xyz/anchor";

export async function prepareDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    clusterOrUrl: Cluster | string;
    program?: Program;
}): Promise<ApiProcessorData[]> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });

    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });

    if (!swapData) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (swapData.status !== TradeStatus.WaitingToDeposit)
        throw {
            blockchain: "solana",
            status: "error",
            message: "Status of the swap isn't in a depositing state.",
            swapStatus: swapData.status,
        } as ErrorFeedback;

    const swapIdentity = getSwapIdentityFromData({
        swapData,
        clusterOrUrl: Data.clusterOrUrl,
    });
    // console.log("swapIdentity from PublicKey", swapIdentity);

    let apiInstructions: ApiProcessorData[] = [];
    let ataList: PublicKey[] = [];
    let isUserPartOfTrade = false;
    let isUserAlreadyDeposited = false;

    let swapDataItems = swapData.items.filter((item) => item.owner.equals(Data.user));

    if (swapDataItems.length > 0) isUserPartOfTrade = true;

    for (const swapDataItem of swapDataItems) {
        if (swapDataItem.isNft) {
            if (swapDataItem.status === ItemStatus.NFTPending) {
                if (swapDataItem.isCompressed) {
                    console.log(
                        "XXX - Deposit CNFT item with TokenId ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );

                    let depositing = await getDepositCNftInstruction({
                        program,
                        signer: Data.user,
                        tokenId: swapDataItem.mint,
                        swapIdentity,
                        prepare: true,
                        clusterOrUrl: Data.clusterOrUrl,
                    });

                    const depositingApi = {
                        blockchain: "solana",
                        type: "deposit NFT",
                        order: 0,
                        description: `Escrow your NFT ${swapDataItem.mint} in swap ${Data.swapDataAccount}`,
                        config: depositing.prepareInstruction,
                    } as ApiProcessorData;

                    apiInstructions.push(depositingApi);
                } else {
                    console.log(
                        "XXX - Deposit NFT item with mint ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );

                    let depositing = await prepareDepositNftInstruction({
                        program,
                        signer: Data.user,
                        mint: swapDataItem.mint,
                        amount: swapDataItem.amount.toNumber(),
                        swapIdentity,
                        ataList,
                    });
                    const depositingApi = {
                        blockchain: "solana",
                        type: "deposit NFT",
                        order: 0,
                        description: `Escrow your NFT ${swapDataItem.mint} in swap ${Data.swapDataAccount}`,
                        config: depositing.instructions,
                    } as ApiProcessorData;

                    apiInstructions.push(depositingApi);
                    depositing.newAtas.forEach((element) => {
                        if (!ataList.includes(element)) {
                            ataList.push(element);
                        }
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
                    case SystemProgram.programId.toBase58():
                        tokenName = "SOL";
                        break;
                }

                console.log(
                    `XXX - Deposit ${tokenName} item with mint `,
                    swapDataItem.mint.toBase58(),
                    " from ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );
                const depositSolInstruction = await prepareDepositSolInstruction({
                    program,
                    swapIdentity,
                    amount: swapDataItem.amount.toNumber(),
                    ataList,
                    mint: swapDataItem.mint,
                    signer: Data.user,
                });
                depositSolInstruction.newAtas.forEach((element) => {
                    if (!ataList.includes(element)) {
                        ataList.push(element);
                    }
                });

                apiInstructions.push({
                    blockchain: "solana",
                    type: `deposit ${tokenName}`,
                    order: 0,
                    description: `Escrow your ${tokenName} in swap ${Data.swapDataAccount}`,
                    config: depositSolInstruction.instructions,
                });
            } else if (swapDataItem.status === ItemStatus.SolDeposited) {
                isUserAlreadyDeposited = true;
            }
        }
    }

    if (isUserPartOfTrade === false) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You are not a part of this swap",
        } as ErrorFeedback;
    } else if (
        apiInstructions.length === 0 &&
        isUserPartOfTrade === true &&
        isUserAlreadyDeposited === true
    ) {
        throw {
            blockchain: "solana",
            message: "You already escrowed your items",
            status: "error",
        } as ErrorFeedback;
    } else if (apiInstructions.length === 0 && isUserPartOfTrade === true) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have no items to escrow in this swap",
        } as ErrorFeedback;
    }

    for (let index = 0; index < apiInstructions.length; index++) {
        const element = apiInstructions[index];
        element.order = index;
    }

    let finalDepositInstruction: ApiProcessorData = {
        blockchain: "solana",
        type: "deposit",
        order: 0,
        description: "Escrow your SOL and/or NFTs to the contract",
        config: [],
    };
    apiInstructions.forEach((apiInstruction) => {
        apiInstruction.config.forEach((element) => {
            if (element.type !== "create-offer" && element.type !== "unwrap-sol") {
                element.programId = program.programId.toString();
            } else {
            }
        });
        finalDepositInstruction.config.push(...apiInstruction.config);
    });
    console.log("found ", finalDepositInstruction.config.length, " items to deposit");

    return [finalDepositInstruction];
}
