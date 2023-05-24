const getProgram = require("../utils/getProgram.obj");
const getSwapDataAccountFromPublicKey = require("../utils/getSwapDataAccountFromPublicKey.function");
const getSwapIdentityFromData = require("../utils/getSwapIdentityFromData.function");
const getDepositNftInstruction = require("./subFunction/deposit.nft.instructions");
const getDepositSolInstruction = require("./subFunction/deposit.sol.instructions");

async function createDepositSwapInstructions(sdaPubkey, userPbkey, programId, cluster) {
    try {
        const { program } = getProgram(cluster);

        // console.log(programId);
        // const program = solanaSwap.getEscrowProgramInstance();
        console.log("programId", program.programId.toBase58());
        const swapData = await getSwapDataAccountFromPublicKey(program, sdaPubkey);

        const swapIdentity = await getSwapIdentityFromData({
            program,
            swapData,
        });

        if (!swapIdentity | !swapData)
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Swap initialization in progress or not initialized. Please try again later.",
                },
            ];
        console.log("SwapData", swapIdentity);
        if (swapData.status !== 1)
            //1
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Status of the swap isn't in a deposit state. Please contact support.",
                    status: swapData.status,
                },
            ];

        // let depositInstructionTransaction: Array<TransactionInstruction> = [];
        let depositInstruction = [];
        let depositInstructions = [];
        let itemsToDeposit = [];
        let ataList = [];
        let isUserPartOfTrade = false;
        let isUserAlreadyDeposited = false;
        for (let item = 0; item < swapData.items.length; item++) {
            let swapDataItem = swapData.items[item];
            if (
                isUserPartOfTrade === false &&
                swapDataItem.owner.toBase58() === userPbkey.toBase58()
            ) {
                isUserPartOfTrade = true;
            }

            switch (swapDataItem.isNft) {
                case true:
                    if (
                        swapDataItem.owner.toBase58() === userPbkey.toBase58() &&
                        swapDataItem.status === 10
                    ) {
                        console.log("XXXXXXX - Deposit NFT item n° ", item, " XXXXXXX");
                        itemsToDeposit.push(swapDataItem);

                        let depositing = await getDepositNftInstruction({
                            program: program,
                            signer: userPbkey,
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
                        depositing.instructions.forEach((depositIx) => {
                            depositInstruction.push(depositIx);
                        });
                    } else if (
                        swapDataItem.owner.toBase58() === userPbkey.toBase58() &&
                        swapDataItem.status === 20
                    ) {
                        isUserAlreadyDeposited = true;
                    }
                    break;
                case false:
                    if (
                        swapDataItem.owner.toBase58() === userPbkey.toBase58() &&
                        swapDataItem.status === 11
                    ) {
                        console.log("XXXXXXX - Deposit SOL item n° ", item, " XXXXXXX");
                        itemsToDeposit.push(swapDataItem);

                        const depositSolInstruction = await getDepositSolInstruction({
                            program: program,
                            signer: userPbkey,
                            swapIdentity,
                        });
                        console.log("depositSolInstruction", depositSolInstruction);

                        depositInstruction.push(depositSolInstruction);

                        console.log("depositSolinstruction added", depositSolInstruction);
                    } else if (
                        swapDataItem.owner.toBase58() === userPbkey.toBase58() &&
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

        console.log("depositInstruction.length", depositInstruction.length);
        return depositInstruction;
    } catch (error) {
        return [error];
    }
}
module.exports = createDepositSwapInstructions;
