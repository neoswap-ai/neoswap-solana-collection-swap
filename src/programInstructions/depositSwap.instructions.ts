import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { getProgram } from "../utils/getProgram.obj";
import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { getSwapIdentityFromData } from "../utils/getSwapIdentityFromData.function";
import { getDepositNftInstruction } from "./subFunction/deposit.nft.instructions";
import { getDepositSolInstruction } from "./subFunction/deposit.sol.instructions";
import { ErrorFeedback, ItemStatus, TradeStatus, TxWithSigner } from "../utils/types";
import { getDepositCNftInstruction } from "./subFunction/deposit.cnft.instructions";
import { Program } from "@coral-xyz/anchor";

export async function createDepositSwapInstructions(Data: {
    swapDataAccount: PublicKey;
    user: PublicKey;
    clusterOrUrl: Cluster | string;
    program?: Program;
}): Promise<TxWithSigner[]> {
    const program = Data.program ? Data.program : getProgram({ clusterOrUrl: Data.clusterOrUrl });
    let swapData = await getSwapDataAccountFromPublicKey({
        program,
        swapDataAccount_publicKey: Data.swapDataAccount,
    });

    if (!swapData) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "Swap initialization in progress or not initialized. Please try again later.",
        } as ErrorFeedback;
    } else if (swapData.status !== TradeStatus.WaitingToDeposit)
        throw {
            blockchain: "solana",
            status: "error",
            message: "Status of the swap isn't in a depositing state.",
            swapStatus: swapData.status,
        } as ErrorFeedback;

    const swapIdentity = getSwapIdentityFromData({
        swapData,
        clusterOrUrl: Data.clusterOrUrl,
    });
    // console.log("swapData", swapData);
    // console.log("Data.user", Data.user);

    let depositInstruction: TxWithSigner[] = [];
    let ataList: PublicKey[] = [];
    let isUserPartOfTrade = false;
    let isUserAlreadyDeposited = false;

    let swapDataItems = swapData.items.filter((item) => item.owner.equals(Data.user));
    // console.log("swapDataItems", swapDataItems);

    if (swapDataItems.length > 0) isUserPartOfTrade = true;

    for (const swapDataItem of swapDataItems) {
        if (swapDataItem.isNft) {
            if (swapDataItem.status === ItemStatus.NFTPending) {
                if (swapDataItem.isCompressed) {
                    console.log(
                        "XXX - Deposit CNFT item with TokenId ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );
                    let ix = await getDepositCNftInstruction({
                        program,
                        signer: Data.user,
                        swapIdentity,
                        tokenId: swapDataItem.mint,
                        clusterOrUrl: Data.clusterOrUrl,
                    });
                    if (!ix.instructions) throw " error prepare Instruction";
                    depositInstruction.push({
                        tx: new Transaction().add(ix.instructions),
                    });
                } else {
                    console.log(
                        "XXX - Deposit NFT item with mint ",
                        swapDataItem.mint.toBase58(),
                        " from ",
                        swapDataItem.owner.toBase58(),
                        " - XXX"
                    );

                    let depositing = await getDepositNftInstruction({
                        program: program,
                        signer: Data.user,
                        mint: swapDataItem.mint,
                        amount: swapDataItem.amount.toNumber(),
                        swapIdentity,
                        ataList,
                    });

                    depositing.newAtas.forEach((element) => {
                        if (!ataList.includes(element)) {
                            ataList.push(element);
                        }
                    });
                    depositInstruction.push({
                        tx: new Transaction().add(...depositing.instructions),
                    });
                }
            } else if (swapDataItem.status === ItemStatus.NFTDeposited) {
                isUserAlreadyDeposited = true;
            }
        } else {
            if (swapDataItem.status === ItemStatus.SolPending) {
                console.log(
                    "XXX - Deposit SOL item with mint ",
                    swapDataItem.mint.toBase58(),
                    " from ",
                    swapDataItem.owner.toBase58(),
                    " - XXX"
                );

                const depositSolInstruction = await getDepositSolInstruction({
                    program: program,
                    signer: Data.user,
                    amount: swapDataItem.amount.toNumber(),
                    swapIdentity,
                    ataList,
                    mint: swapDataItem.mint,
                });

                depositInstruction.push({
                    tx: new Transaction().add(...depositSolInstruction.instructions),
                });
            } else if (swapDataItem.status === ItemStatus.SolDeposited) {
                isUserAlreadyDeposited = true;
            }
        }
    }

    if (isUserPartOfTrade === false) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You are not a part of this swap",
        } as ErrorFeedback;
    } else if (
        depositInstruction.length === 0 &&
        isUserPartOfTrade === true &&
        isUserAlreadyDeposited === true
    ) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have already escrowed your items in this swap",
        } as ErrorFeedback;
    } else if (depositInstruction.length === 0 && isUserPartOfTrade === true) {
        throw {
            blockchain: "solana",
            status: "error",
            message: "You have no items to escrow in this swap",
        } as ErrorFeedback;
    }
    console.log("found ", depositInstruction.length, " items to deposit");

    return depositInstruction;
}
