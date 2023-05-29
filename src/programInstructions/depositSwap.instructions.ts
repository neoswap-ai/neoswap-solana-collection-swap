import { Cluster, PublicKey, Signer, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getDepositNftInstruction } from "./subFunction/deposit.nft.instructions";
import { getDepositSolInstruction } from "./subFunction/deposit.sol.instructions";
import { ErrorFeedback, TradeStatus, TxWithSigner } from "../utils/types";

export async function createDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner | ErrorFeedback> {
    try {
        const program= getProgram(Data.cluster);

        // console.log(programId);
        // const program = solanaSwap.getEscrowProgramInstance();
        // console.log("programId", program.programId.toBase58());
        // console.log("swapDataAccount", Data.swapDataAccount.toBase58());
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
        // let depositInstructions = [];
        // let itemsToDeposit = [];
        let depositInstruction: TxWithSigner = [];
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

                        let depositing = await getDepositNftInstruction({
                            program: program,
                            signer: Data.user,
                            mint: swapDataItem.mint,
                            swapIdentity,
                            ataList,
                        });

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
                        depositInstruction.push({
                            tx: new Transaction().add(...depositing.instructions),
                        });
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

                        const depositSolInstruction = await getDepositSolInstruction({
                            program: program,
                            signer: Data.user,
                            swapIdentity,
                        });
                        console.log("depositSolInstruction", depositSolInstruction);

                        depositInstruction.push({
                            tx: new Transaction().add(depositSolInstruction),
                        });

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
            depositInstruction.length === 0 &&
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
        } else if (depositInstruction.length === 0 && isUserPartOfTrade === true) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description: "You have no items to escrow in this swap",
                },
            ];
        }

        // console.log("depositInstruction.length", depositInstruction.length);

        return depositInstruction;
    } catch (error) {
        return [{ blockchain: "solana", description: error, order: 0, type: "error" }];
    }
}
