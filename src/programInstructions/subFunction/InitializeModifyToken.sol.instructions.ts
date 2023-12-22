import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { SwapIdentity, TokenSwapItem } from "../../utils/types";

export async function getInitializeModifyTokenInstructions(Data: {
    program: Program;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    tradeToModify?: TokenSwapItem;
}) {
    if (!Data.tradeToModify) return;
    return await Data.program.methods
        .initializeModifyToken(Data.swapIdentity.swapDataAccount_seed, Data.tradeToModify)
        .accounts({
            swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
            signer: Data.signer.toBase58(),
        })
        .instruction();
}
