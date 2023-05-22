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
        let apiInstructions = [];
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
                        const depositingApi = {
                            blockchain: "solana",
                            type: "deposit NFT",
                            order: 0,
                            description: `Escrow your NFT ${swapDataItem.mint} in swap ${sdaPubkey}`,
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
                        depositing.instructions.forEach((depositIx) => {
                            depositInstruction.push(depositIx);
                        });
                    } else if (
                        swapDataItem.owner.toBase58() === userPbkey.toBase58() &&
                        swapDataItem.status === 20
                    ) {
                        isUserAlreadyDeposited = true;
                    }
                    break;swapDataAccount_publicKey
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
                            // from: userPbkey,
                            // to: sdaPubkey,
                            // seed: swapIdentity.seed.toString(),
                            // bump: swapIdentity.bump,
                        });
                        console.log("depositSolInstruction", depositSolInstruction);
                        apiInstructions.push({
                            blockchain: "solana",
                            type: "deposit SOL",
                            order: 0,
                            description: `Escrow your SOL in swap ${sdaPubkey}`,
                            config: [depositSolInstruction],
                        });
                        depositInstruction.push(depositSolInstruction);
                        // depositing.instruction.forEach((element) => {});

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
        let finalDepositInstruction = [
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
                element.programId = programId;
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
module.exports = createDepositSwapInstructions;
