import { Cluster, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getClaimNftInstructions } from "./subFunction/claim.nft.instructions";
import { getClaimSolInstructions } from "./subFunction/claim.sol.instructions";
import { ErrorFeedback, ItemStatus, TradeStatus, TxWithSigner } from "../utils/types";
import { getClaimCNftInstruction } from "./subFunction/claim.cnft.instructions";
import { Program } from "@project-serum/anchor";

export async function createClaimSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    clusterOrUrl: Cluster | string;
    skipFinalize?: boolean;
    program?: Program;
}): Promise<TxWithSigner[] | undefined> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });

    const swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });
    if (!swapData) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (
        !(
            swapData.status === TradeStatus.WaitingToClaim ||
            swapData.status === TradeStatus.WaitingToDeposit
        )
    ) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap is't in the adequate status for Validate Claim.",
            swapStatus: swapData.status,
        } as ErrorFeedback;
    }
    let init = false;
    if (swapData.initializer.equals(Data.signer) || !Data.skipFinalize) {
        init = true;
    }
    // else if (swapData.status !== TradeStatus.WaitingToClaim) {
    //     throw {
    //         blockchain: "solana",
    //         status: "error",
    //         message:
    //             "Swap is't in the adequate status for Claiming an item & you're not Initializer",
    //         swapStatus: swapData.status,
    //     } as ErrorFeedback;
    // }
    const swapIdentity = getSwapIdentityFromData({
        swapData,
        clusterOrUrl: Data.clusterOrUrl,
    });

    let claimTransactionInstruction: TxWithSigner[] = [];
    let ataList: PublicKey[] = [];

    let swapDataItems = swapData.items.filter(
        (swapDataItem) =>
            swapDataItem.status === ItemStatus.NFTDeposited ||
            swapDataItem.status === ItemStatus.SolToClaim
    );

    if (!init) swapDataItems = swapDataItems.filter((item) => item.destinary.equals(Data.signer));

    for (const swapDataItem of swapDataItems) {
        if (init === true || swapDataItem.destinary.equals(Data.signer)) {
            if (swapDataItem.isNft) {
                if (swapDataItem.status === ItemStatus.NFTDeposited) {
                    if (swapDataItem.isCompressed) {
                        console.log(
                            "XXX - Claim CNFT swapDataItem with TokenId ",
                            swapDataItem.mint.toBase58(),
                            " to ",
                            swapDataItem.destinary.toBase58(),
                            " - XXX"
                        );

                        const claimNftData = await getClaimCNftInstruction({
                            program,
                            user: swapDataItem.destinary,
                            tokenId: swapDataItem.mint,
                            signer: Data.signer,
                            swapIdentity,
                            // ataList,
                        });
                        claimTransactionInstruction.push({
                            tx: new Transaction().add(claimNftData),
                        });
                    } else {
                        console.log(
                            "XXX - Claim NFT swapDataItem with mint ",
                            swapDataItem.mint.toBase58(),
                            " to ",
                            swapDataItem.destinary.toBase58(),
                            " - XXX"
                        );
                        const claimNftData = await getClaimNftInstructions({
                            program,
                            destinary: swapDataItem.destinary,
                            mint: swapDataItem.mint,
                            signer: Data.signer,
                            swapIdentity,
                            ataList,
                        });

                        claimTransactionInstruction.push({
                            tx: new Transaction().add(...claimNftData.instruction),
                        });
                        claimNftData.newAtas.forEach((ata) => {
                            if (!ataList.includes(ata)) ataList.push(ata);
                        });
                    }
                }
            } else {
                console.log(
                    "XXX - Claim Sol item mint ",
                    swapDataItem.mint.toBase58(),
                    "to ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );
                const claimSolData = await getClaimSolInstructions({
                    program: program,
                    user: swapDataItem.owner,
                    signer: Data.signer,
                    swapIdentity,
                    ataList,
                    mint: swapDataItem.mint,
                });

                claimTransactionInstruction.push({
                    tx: new Transaction().add(...claimSolData.instructions),
                });
                claimSolData.newAtas.forEach((ata) => {
                    if (!ataList.includes(ata)) ataList.push(ata);
                });
            }
        }
    }
    if (claimTransactionInstruction.length > 0) {
        console.log("found ", claimTransactionInstruction.length, " items to claim");
        return claimTransactionInstruction;
    } else {
        return undefined;
    }
}
