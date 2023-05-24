import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getCancelNftInstructions } from "./subFunction/cancel.nft.instructions";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getCancelSolInstructions } from "./subFunction/cancel.sol.instructions";
import { Cluster, PublicKey, TransactionInstruction } from "@solana/web3.js";

export async function createClaimSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}) {
    try {
        const { program } = getProgram(Data.cluster);

        // console.log(programId);
        // const program = getEscrowProgramInstance();
        console.log("programId", program.programId.toBase58());
        const swapData = await getSwapDataAccountFromPublicKey(program, Data.swapDataAccount);
        if (!swapData)
            return [
                {
                    blockchain: "solana",
                    type: "error",
                    order: 0,
                    description:
                        "Swap initialization in progress or not initialized. Please try again later.",
                },
            ];

        const swapIdentity = await getSwapIdentityFromData({
            swapData,
        });

        if (!swapIdentity || !swapData)
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
        let cancelTransactionInstruction: TransactionInstruction[] = [];
        let ataList: PublicKey[] = [];

        for (const item of swapData.items) {
       
            console.log("item.status", item.status);
            if ([20, 21].includes(item.status)) {
                switch (item.isNft) {
                    case true:
                        const { instructions, newAtas } = await getCancelNftInstructions({
                            program,
                            owner: item.owner,
                            mint: item.mint,
                            signer: Data.signer,
                            swapIdentity,
                            ataList,
                        });
                        cancelTransactionInstruction.push(...instructions);
                        ataList.push(...newAtas);
                        console.log("cancelNftinstruction added");
                        break;

                    case false:
                        const { instruction } = await getCancelSolInstructions({
                            program: program,
                            user: item.owner,
                            signer: Data.signer,
                            swapIdentity,
                        });
                        cancelTransactionInstruction.push(instruction);
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
