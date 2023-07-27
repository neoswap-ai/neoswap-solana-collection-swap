import { Cluster, PublicKey } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { prepareDepositNftInstruction } from "./subFunction/deposit.nft.prepareInstructions";
import { prepareDepositSolInstruction } from "./subFunction/deposit.sol.prepareInstructions";
import { ApiProcessorData, ErrorFeedback, ItemStatus, TradeStatus } from "../utils/types";

export async function prepareDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    clusterOrUrl: Cluster | string;
}): Promise<ApiProcessorData[]> {
    const program = getProgram({ clusterOrUrl: Data.clusterOrUrl });

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
    });
    console.log("swapIdentity from PublicKey", swapIdentity);

    let apiInstructions: ApiProcessorData[] = [];
    let ataList: PublicKey[] = [];
    let isUserPartOfTrade = false;
    let isUserAlreadyDeposited = false;

    let swapDataItems = swapData.items.filter((item) => item.owner.equals(Data.user));

    if (swapDataItems.length > 0) isUserPartOfTrade = true;

    for (const swapDataItem of swapDataItems) {
        if (swapDataItem.isNft) {
            if (swapDataItem.status === ItemStatus.NFTPending) {
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
            } else if (swapDataItem.status === ItemStatus.NFTDeposited) {
                isUserAlreadyDeposited = true;
            }
        } else {
            if (swapDataItem.status === ItemStatus.SolPending) {
                console.log(
                    "XXX - Deposit SOL item with mint ",
                    swapDataItem.mint.toBase58(),
                    " from ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );
                const depositSolInstruction = await prepareDepositSolInstruction({
                    program,
                    swapIdentity,
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
                    type: "deposit SOL",
                    order: 0,
                    description: `Escrow your SOL in swap ${Data.swapDataAccount}`,
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
