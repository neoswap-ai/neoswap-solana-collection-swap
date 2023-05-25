import { Cluster, PublicKey } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { prepareDepositNftInstruction } from "./subFunction/deposit.nft.prepareInstructions";
import { prepareDepositSolInstruction } from "./subFunction/deposit.sol.prepareInstructions";
import { ApiProcessorData, TradeStatus } from "../utils/types";

export async function prepareDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    cluster: Cluster;
}) {
    try {
        const { program } = getProgram(Data.cluster);

        // console.log(programId);
        // const program = solanaSwap.getEscrowProgramInstance();
        // console.log("programId", program.programId.toBase58());
        const swapData = await getSwapDataAccountFromPublicKey(program, Data.swapDataAccount);
        if (!swapData) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Swap initialization in progress or not initialized. Please try again later.",
                },
            ];
        } else if (swapData.status !== TradeStatus.WaitingToDeposit)
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "Status of the swap isn't in a depositing state.",
                    status: swapData.status,
                },
            ];

        const swapIdentity = getSwapIdentityFromData({
            swapData,
        });

        if (!swapIdentity)
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Data retrieved from the Swap did not allow to build the SwapIdentity.",
                },
            ];
        // console.log("swapIdentity", swapIdentity);

        // let depositInstructionTransaction: Array<TransactionInstruction> = [];
        // let depositInstruction = [];
        // let itemsToDeposit = [];
        let apiInstructions: ApiProcessorData = [];
        let ataList: PublicKey[] = [];
        let isUserPartOfTrade = false;
        let isUserAlreadyDeposited = false;
        for (let item = 0; item < swapData.items.length; item++) {
            let swapDataItem = swapData.items[item];
            if (
                isUserPartOfTrade === false &&
                swapDataItem.owner.toBase58() === Data.user.toBase58()
            ) {
                isUserPartOfTrade = true;
            }

            switch (swapDataItem.isNft) {
                case true:
                    if (
                        swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === 10
                    ) {
                        console.log("XXXXXXX - Deposit NFT item n° ", item, " XXXXXXX");
                        // itemsToDeposit.push(swapDataItem);

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
                        };
                        console.log("depositingApi", depositingApi);
                        apiInstructions.push(depositingApi);
                        let isPush = true;
                        depositing.mintAta.forEach((element) => {
                            ataList.forEach((ataElem) => {
                                if (element === ataElem) {
                                    isPush = false;
                                    console.log("alreadyexist:", element);
                                }
                            });

                            if (isPush) ataList.push(element);
                        });
                        // depositing.instructions.forEach((depositIx) => {
                        //     depositInstruction.push(depositIx);
                        // });
                    } else if (
                        swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === 20
                    ) {
                        isUserAlreadyDeposited = true;
                    }
                    break;
                case false:
                    if (
                        swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === 11
                    ) {
                        console.log("XXXXXXX - Deposit SOL item n° ", item, " XXXXXXX");
                        // itemsToDeposit.push(swapDataItem);

                        const depositSolInstruction = await prepareDepositSolInstruction({
                            // program: program,
                            from: Data.user,
                            to: Data.swapDataAccount,
                            swapIdentity,
                        });
                        console.log("depositSolInstruction", depositSolInstruction);
                        apiInstructions.push({
                            blockchain: "solana",
                            type: "deposit SOL",
                            order: 0,
                            description: `Escrow your SOL in swap ${Data.swapDataAccount}`,
                            config: [depositSolInstruction],
                        });
                        // depositInstruction.push(depositSolInstruction);
                        // depositing.instruction.forEach((element) => {});

                        console.log("depositSolinstruction added", depositSolInstruction);
                    } else if (
                        swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === 21
                    ) {
                        isUserAlreadyDeposited = true;
                    }

                    break;
            }
        }

        if (isUserPartOfTrade === false) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "You are not a part of this swap",
                },
            ];
        } else if (
            apiInstructions.length === 0 &&
            isUserPartOfTrade === true &&
            isUserAlreadyDeposited === true
        ) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "You have already escrowed your items in this swap",
                },
            ];
        } else if (apiInstructions.length === 0 && isUserPartOfTrade === true) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "You have no items to escrow in this swap",
                },
            ];
        }
        for (let index = 0; index < apiInstructions.length; index++) {
            const element = apiInstructions[index];
            element.order = index;
        }
        console.log("apiInstructions", apiInstructions);
        let finalDepositInstruction: ApiProcessorData = [
            {
                blockchain: "solana",
                type: "deposit",
                order: 0,
                description: "Escrow your SOL and/or NFTs to the contract",
                config: [],
            },
        ];
        apiInstructions.forEach((apiInstruction) => {
            console.log("apiInstruction.description", apiInstruction.description);
            finalDepositInstruction[0].description.concat(apiInstruction.description);

            apiInstruction.config.forEach((element) => {
                element.programId = program.programId;
            });
            console.log("apiInstruction.config", apiInstruction.config);
            finalDepositInstruction[0].config.push(...apiInstruction.config);
        });
        console.log("finalDepositInstruction", finalDepositInstruction);
        return finalDepositInstruction;
    } catch (error) {
        return [error];
    }
}
