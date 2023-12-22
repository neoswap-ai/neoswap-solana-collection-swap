import { PublicKey, TransactionInstruction } from "@solana/web3.js";

import { Program } from "@coral-xyz/anchor";
import { NftSwapItem, SwapIdentity, TokenSwapItem } from "../../utils/types";

export async function getInitializeModifyNftInstructions(Data: {
    program: Program;
    signer: PublicKey;
    swapIdentity: SwapIdentity;
    tradesToModify: { nftSwapItem: NftSwapItem; isMaker: boolean }[];
}) {
    let instructions: TransactionInstruction[] = [];
    await Promise.all(
        Data.tradesToModify.map(async (tradeToModify) => {
            instructions.push(
                await Data.program.methods
                    .initializeModifyNft(
                        Data.swapIdentity.swapDataAccount_seed,
                        tradeToModify.nftSwapItem,
                        tradeToModify.isMaker
                    )
                    .accounts({
                        swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                        signer: Data.signer.toBase58(),
                    })
                    .instruction()
            );
        })
    );
    if (instructions.length === 0) return;
    return instructions;
}
