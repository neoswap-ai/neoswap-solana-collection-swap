const getProgram = require("../utils/getProgram.obj");
const getSwapDataAccountFromPublicKey = require("../utils/getSwapDataAccountFromPublicKey.function");
const getSwapIdentityFromData = require("../utils/getSwapIdentityFromData.function");
async function createClaimSwapInstructions(
    swapDataAccount_publicKey,

    programId,
    cluster
) {
    try {
        const { program } = getProgram(cluster);

        // console.log(programId);
        // const program = solanaSwap.getEscrowProgramInstance();
        console.log("programId", program.programId.toBase58());
        const swapData = await getSwapDataAccountFromPublicKey(program, swapDataAccount_publicKey);

        const swapIdentity = await getSwapIdentityFromData(swapData);

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
        if (swapIdentity.swapData.status !== 1) {
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Status of the swap isn't in a deposit state. Please contact support.",
                    status: swapIdentity.swapData.status,
                },
            ];
        }
        // let depositInstructionTransaction: Array<TransactionInstruction> = [];
        let claimTransactionInstruction = [];
        let ataList = [];

        for (const item of swapData.items) {
            switch (item.isNft) {
                case true:
                    if (item.status === 20) {
                        const { instructions, newAtas } = await getClaimNftInstructions({
                            program,
                            owner: item.destinary,
                            mint: item.mint,
                            signer,
                            SDA,
                            ataList,
                        });
                        claimTransactionInstruction.push(instructions);
                        ataList.push(newAtas);
                        console.log("claimNftinstruction added");
                    }
                    break;

                case false:
                    if (item.status === 22) {
                        const claimingSol = await getClaimSolInstructions({
                            program: program,
                            owner: item.owner,
                            signer: signer,
                            SDA,
                        });
                        claimTransactionInstruction.push(claimingSol);
                        console.log("claimSolinstruction added");
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

module.exports = createClaimSwapInstructions;
