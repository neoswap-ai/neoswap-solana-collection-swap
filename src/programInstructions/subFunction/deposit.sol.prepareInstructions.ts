import { PublicKey, SystemProgram } from "@solana/web3.js";
import { SwapIdentity } from "../../utils/types";

export async function prepareDepositSolInstruction(Data: {
    from: PublicKey;
    to: PublicKey;
    swapIdentity: SwapIdentity;
}) {
    return {
        type: "depositSol",
        data: {
            arguments: {
                seed: Data.swapIdentity.swapDataAccount_seed,
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
