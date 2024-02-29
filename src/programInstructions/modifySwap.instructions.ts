import { getSwapDataAccountFromPublicKey } from "../utils/getSwapDataAccountFromPublicKey.function";
import { Cluster, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { NftSwapItem, SwapInfo, TokenSwapItem, TxWithSigner } from "../utils/types";
import { Program } from "@coral-xyz/anchor";
import { swapDataConverter } from "../utils/swapDataConverter.function";
import { getInitializeModifyNftInstructions } from "./subFunction/InitializeModifyNft.nft.instructions";
import { getInitializeModifyTokenInstructions } from "./subFunction/InitializeModifyToken.sol.instructions";
import bs58 from "bs58";
import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "../utils/const";
import { getProgram } from "../utils/getProgram.obj";

export async function createModifySwapInstructions(Data: {
    swapInfo: SwapInfo;
    swapDataAccount: PublicKey;
    signer: PublicKey;
    // user: PublicKey;
    clusterOrUrl?: Cluster | string;
    program?: Program;
    validateOwnership?: "warning" | "error";
    validateOwnershipIgnore?: string[];
}): Promise<TxWithSigner[] | undefined> {
    if (Data.program && Data.clusterOrUrl) {
    } else if (!Data.clusterOrUrl && Data.program) {
        Data.clusterOrUrl = Data.program.provider.connection.rpcEndpoint;
    } else if (!Data.program && Data.clusterOrUrl) {
        Data.program = getProgram({ clusterOrUrl: Data.clusterOrUrl });
    } else {
        throw "there should be a program or a cluster";
    }

    let swapIdentity = await swapDataConverter({
        swapInfo: Data.swapInfo,
        clusterOrUrl: Data.clusterOrUrl,
        connection: Data.program.provider.connection,
        swapDataAccount: Data.swapDataAccount,
    });

    let bcData = await getSwapDataAccountFromPublicKey({
        swapDataAccount_publicKey: Data.swapDataAccount,
        clusterOrUrl: Data.clusterOrUrl,
        program: Data.program,
    });

    if (!bcData) throw "swapDataAccount doesn't exist";

    // swapIdentity.swapDataAccount_seed = Buffer.from(bs58.decode(bcData.seedString));
    // swapIdentity.swapDataAccount_publicKey = PublicKey.findProgramAddressSync(
    //     [swapIdentity.swapDataAccount_seed],
    //     Data.clusterOrUrl.includes("devnet") ? NEOSWAP_PROGRAM_ID_DEV : NEOSWAP_PROGRAM_ID
    // )[0];
    let mintAdded: PublicKey[] = [];
    const tokenItemToUpdateEmpty = bcData.tokenItems.filter(
        (item) => item.owner.equals(SystemProgram.programId)
        // &&
        // item.amount.eq(
        //     swapIdentity.swapData.tokenItems.find((searchItem) =>
        //         searchItem.amount.eq(item.amount)
        //     )?.amount!
        // )
    );
    let userAdded: string[] = [];
    let tokenItemToUpdate: TokenSwapItem[] = [];
    tokenItemToUpdateEmpty.map((tokenItemToUpdateI) => {
        console.log("tokenItemToUpdateI", tokenItemToUpdateI);
        let itemfound = swapIdentity.swapData.tokenItems.find((searchItem) => {
            console.log("searchItem", searchItem);
            return (
                searchItem.amount.eq(tokenItemToUpdateI.amount) &&
                !!!userAdded.includes(searchItem.owner.toString())
            );
        });
        if (!!itemfound) {
            tokenItemToUpdate.push(itemfound);
            userAdded.push(itemfound.owner.toString());
        }
    });

    // const tokenItemToUpdate = tokenItemToUpdateEmpty.map((tokenItemToUpdateI) => {
    //    return  swapIdentity.swapData.tokenItems.filter((searchItem) => {
    //         return (
    //             searchItem.amount.eq(tokenItemToUpdateI.amount) &&
    //             !searchItem.owner.equals(SystemProgram.programId)
    //         );
    //     });
    // });

    const nftMakerItemToUpdateEmpty = bcData.nftItems.filter(
        (item) => item.destinary.equals(SystemProgram.programId) // &&
        // item.amount &&
        // item.mint &&
        // item.merkleTree
    );

    let nftMakerItemToUpdate: {
        nftSwapItem: NftSwapItem;
        isMaker: boolean;
    }[] = nftMakerItemToUpdateEmpty
        .map((nftItemToUpdate) => {
            let item = swapIdentity.swapData.nftItems.find(
                (ll) =>
                    ll.owner.equals(nftItemToUpdate.owner) &&
                    ll.collection.equals(nftItemToUpdate.collection) &&
                    !mintAdded.includes(ll.mint)
            )!;
            mintAdded.push(item.mint);
            return item;
        })
        .map((nftItemToUpdate) => {
            return { nftSwapItem: nftItemToUpdate, isMaker: true };
        });

    const nftTakerItemToUpdateEmpty = bcData.nftItems.filter(
        (item) =>
            item.owner.equals(SystemProgram.programId) && item.mint.equals(SystemProgram.programId) // ||
    );
    let nftTakerItemToUpdate = nftTakerItemToUpdateEmpty
        .map((nftItemToUpdate) => {
            let item = swapIdentity.swapData.nftItems.find(
                (ll) =>
                    ll.destinary.equals(nftItemToUpdate.destinary) &&
                    ll.collection.equals(nftItemToUpdate.collection) &&
                    !mintAdded.includes(ll.mint)
            )!;
            mintAdded.push(item.mint);
            return item;
        })
        .map((nftItemToUpdate) => {
            return { nftSwapItem: nftItemToUpdate, isMaker: false };
        });
    // swapIdentity.swapData.initializer = Data.signer;
    // if (!swapIdentity.swapDataAccount_publicKey.equals(Data.swapDataAccount))
    //     throw "wrong swapDataAccount";

    console.log("token to update", tokenItemToUpdateEmpty, tokenItemToUpdate);
    console.log("nft Maker to update", nftMakerItemToUpdateEmpty, nftMakerItemToUpdate);
    console.log("nft Taker to update", nftTakerItemToUpdateEmpty, nftTakerItemToUpdate);
    // console.log("token to update", tokenItemToUpdateEmpty, tokenItemToUpdate);
    console.log("swapidentity to update", swapIdentity);
    console.log("swapData ", swapIdentity.swapData.nftItems, swapIdentity.swapData.tokenItems);

    try {
        const modifyTokenInstruction = await getInitializeModifyTokenInstructions({
            program: Data.program,
            swapIdentity,
            signer: Data.signer,
            // user:Data.user,
            tradeToModify: tokenItemToUpdate,
        });
        const modifyNftInstruction = await getInitializeModifyNftInstructions({
            program: Data.program,
            swapIdentity,
            signer: Data.signer,
            tradesToModify: nftMakerItemToUpdate.concat(nftTakerItemToUpdate),
        });
        let txWithoutSigner: TxWithSigner[] = [];

        if (!!modifyTokenInstruction && modifyTokenInstruction.length > 0) {
            txWithoutSigner.push({
                tx: new Transaction().add(...modifyTokenInstruction),
                // signers: [signer],
            });
        } else {
            console.log("modifyTokenInstruction skipped");
        }

        if (!!modifyNftInstruction && modifyNftInstruction.length > 0) {
            txWithoutSigner.push({
                tx: new Transaction().add(...modifyNftInstruction),
            });
            // modifyNftInstruction.map((addInstruction) => {
            // });
        } else {
            console.log("modifyNftInstruction was skipped");
        }
        if (txWithoutSigner.length > 0) {
            return txWithoutSigner;
        } else return;
    } catch (error: any) {
        console.log("error init", error);

        throw {
            blockchain: "solana",
            status: "error",
            message: error,
            ...swapIdentity,
        };
    }
}
