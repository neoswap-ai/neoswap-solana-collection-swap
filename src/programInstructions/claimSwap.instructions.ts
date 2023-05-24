import { Cluster, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getClaimNftInstructions } from "./subFunction/claim.nft.instructions";
import { getClaimSolInstructions } from "./subFunction/claim.sol.instructions";

export async function createClaimSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    cluster: Cluster | string;
}) {
    try {
        const { program } = getProgram(Data.cluster);

        // console.log(programId);
        // const program = solanaSwap.getEscrowProgramInstance();
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
        // let depositInstructionTransaction: Array<TransactionInstruction> = [];
        let claimTransactionInstruction: TransactionInstruction[] = [];
        let ataList: PublicKey[] = [];

        for (const item of swapData.items) {
            switch (item.isNft) {
                case true:
                    if (item.status === 20) {
                        const { instruction, mintAta } = await getClaimNftInstructions({
                            program,
                            destinary: item.destinary,
                            mint: item.mint,
                            signer: Data.signer,
                            swapIdentity,
                            ataList,
                        });
                        claimTransactionInstruction.push(...instruction);
                        ataList.push(...mintAta);
                        console.log("claimNftinstruction added");
                    }
                    break;

                case false:
                    if (item.status === 22) {
                        const { instruction } = await getClaimSolInstructions({
                            program: program,
                            user: item.owner,
                            signer: Data.signer,
                            swapIdentity,
                        });
                        claimTransactionInstruction.push(instruction);
                        console.log("claimSolinstruction added");
                    }
                    break;
            }
        }

        return { instructions: claimTransactionInstruction, ataList };
    } catch (error) {
        return [error];
    }
}
