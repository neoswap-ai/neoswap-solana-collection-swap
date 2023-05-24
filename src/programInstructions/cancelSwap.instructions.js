const getProgram = require("../utils/getProgram.obj");
const getSwapDataAccountFromPublicKey = require("../utils/getSwapDataAccountFromPublicKey.function");
const getCancelNftInstructions = require("./subFunction/cancel.nft.instructions");
const getSwapIdentityFromData = require("../utils/getSwapIdentityFromData.function");
const getCancelSolInstructions = require("./subFunction/cancel.sol.instructions");

async function createClaimSwapInstructions(
    swapDataAccount_publicKey,

    programId,
    cluster
) {
    try {
        const { program } = getProgram(cluster);

        // console.log(programId);
        // const program = getEscrowProgramInstance();
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
        // if (swapIdentity.swapData.status !== 1) {
        //     return [
        //         {
        //             blockchain: "solana",
        //             type: "error",
        //             order: 0,
        //             description:
        //                 "Status of the swap isn't in a deposit state. Please contact support.",
        //             status: swapIdentity.swapData.status,
        //         },
        //     ];
        // }
        // let depositInstructionTransaction: Array<TransactionInstruction> = [];
        let cancelTransactionInstruction = [];
        let ataList = [];

        for (const item of swapData.items) {
            console.log("item.status", item.status);
            if ([20, 21].includes(item.status)) {
                switch (item.isNft) {
                    case true:
                        const { instructions, newAtas } = await getCancelNftInstructions({
                            program,
                            owner: item.owner,
                            mint: item.mint,
                            signer,
                            SDA,
                            ataList,
                        });
                        cancelTransactionInstruction.push(instructions);
                        ataList.push(newAtas);
                        console.log("cancelNftinstruction added");
                        break;

                    case false:
                        const cancelSol = await getCancelSolInstructions({
                            program: program,
                            owner: item.owner,
                            signer: signer,
                            SDA,
                        });
                        cancelTransactionInstruction.push(cancelSol);
                        console.log("cancelSolinstruction added");
                        break;
                }
            }
        }

        if (cancelTransactionInstruction.length === 0) {
            return undefined;
        } else {
            return cancelTransactionInstruction;
        }
    } catch (error) {
        return [error];
    }
}

module.exports = createClaimSwapInstructions;
