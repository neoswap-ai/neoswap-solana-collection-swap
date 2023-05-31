import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ApiProcessorConfigType, SwapIdentity } from "../../utils/types";
import { SWAP_PROGRAM_ID } from "../../utils/const";

export async function prepareDepositSolInstruction(Data: {
    programId: PublicKey;
    from: PublicKey;
    to: PublicKey;
    swapIdentity: SwapIdentity;
}): Promise<ApiProcessorConfigType> {
    return {
        type: "depositSol",
        programId: Data.programId.toString(),
        data: {
            arguments: {
                seed: Data.swapIdentity.swapDataAccount_seed.toString(),
                bump: Data.swapIdentity.swapDataAccount_bump,
            },
            accounts: {
                systemProgram: SystemProgram.programId.toString(),
                swapDataAccount: Data.to.toString(),
                signer: Data.from.toString(),
            },
        },
    };
}
