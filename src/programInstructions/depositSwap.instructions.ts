import { Cluster, PublicKey, Signer, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getDepositNftInstruction } from "./subFunction/deposit.nft.instructions";
import { getDepositSolInstruction } from "./subFunction/deposit.sol.instructions";
import { ErrorFeedback, ItemStatus, SwapData, TradeStatus, TxWithSigner } from "../utils/types";

export async function createDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    cluster: Cluster | string;
}): Promise<TxWithSigner> {
    try {
        const program = getProgram(Data.cluster);
        let swapData: SwapData | undefined;
        try {
            swapData = await getSwapDataAccountFromPublicKey({
                program,
                swapDataAccount_publicKey: Data.swapDataAccount,
            });
            // console.log("swapData", swapData);
        } catch (error) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: error,
                },
            ];
        }
        // console.log("swapData2", swapData);

        if (!swapData) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message:
                        "Swap initialization in progress or not initialized. Please try again later.",
                },
            ];
        } else if (swapData.status !== TradeStatus.WaitingToDeposit)
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: "Status of the swap isn't in a depositing state.",
                    swapStatus: swapData.status,
                },
            ];

        const swapIdentity = getSwapIdentityFromData({
            swapData,
        });

        if (!swapIdentity)
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message:
                        "Data retrieved from the Swap did not allow to build the SwapIdentity.",
                },
            ];

        let depositInstruction: TxWithSigner = [];
        let ataList: PublicKey[] = [];
        let isUserPartOfTrade = false;
        let isUserAlreadyDeposited = false;
        /// switch to map / filter  /!\ newAtas issue

        let swapDataItems = swapData.items.filter((item) => {
            item.owner.equals(Data.user);
        });

        for (let item = 0; item < swapDataItems.length; item++) {
            let swapDataItem = swapDataItems[item];

            if (
                isUserPartOfTrade === false &&
                swapDataItem.owner.toBase58() === Data.user.toBase58()
            ) {
                isUserPartOfTrade = true;
            }

            switch (swapDataItem.isNft) {
                case true:
                    if (
                        // swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === ItemStatus.NFTPending //10
                    ) {
                        console.log("XXXXXXX - Deposit NFT item n° ", item, " XXXXXXX");

                        let depositing = await getDepositNftInstruction({
                            program: program,
                            signer: Data.user,
                            mint: swapDataItem.mint,
                            swapIdentity,
                            ataList,
                        });

                        depositing.newAtas.forEach((element) => {
                            if (!ataList.includes(element)) {
                                ataList.push(element);
                            }
                        });
                        depositInstruction.push({
                            tx: new Transaction().add(...depositing.instructions),
                        });
                    } else if (
                        // swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === ItemStatus.NFTDeposited //20
                    ) {
                        isUserAlreadyDeposited = true;
                    }
                    break;
                case false:
                    if (
                        swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === ItemStatus.SolPending //11
                    ) {
                        console.log("XXXXXXX - Deposit SOL item n° ", item, " XXXXXXX");

                        const depositSolInstruction = await getDepositSolInstruction({
                            program: program,
                            signer: Data.user,
                            swapIdentity,
                            ataList,
                            mint: swapDataItem.mint,
                        });
                        // console.log(
                        //     "depositSolInstruction",
                        //     depositSolInstruction.instructions.length
                        // );

                        depositInstruction.push({
                            tx: new Transaction().add(...depositSolInstruction.instructions),
                        });

                        // console.log("depositSolinstruction added", depositSolInstruction);
                    } else if (
                        swapDataItem.owner.toBase58() === Data.user.toBase58() &&
                        swapDataItem.status === ItemStatus.SolDeposited //21
                    ) {
                        isUserAlreadyDeposited = true;
                    }

                    break;
            }
        }

        if (isUserPartOfTrade === false) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: "You are not a part of this swap",
                },
            ];
        } else if (
            depositInstruction.length === 0 &&
            isUserPartOfTrade === true &&
            isUserAlreadyDeposited === true
        ) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: "You have already escrowed your items in this swap",
                },
            ];
        } else if (depositInstruction.length === 0 && isUserPartOfTrade === true) {
            throw [
                {
                    blockchain: "solana",
                    status: "error",
                    order: 0,
                    message: "You have no items to escrow in this swap",
                },
            ];
        }

        return depositInstruction;
    } catch (error) {
        throw [{ blockchain: "solana", message: error, order: 0, status: "error" }];
    }
}
