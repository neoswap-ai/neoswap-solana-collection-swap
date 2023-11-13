import { BN, Program } from "@coral-xyz/anchor";
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { ApiProcessorConfigType, TxWithSigner } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { decode } from "bs58";
import { getProofMeta } from "../utils/getCNFTData.function";

export const apiProcessorTranscript = async (Data: {
    clusterOrUrl: Cluster | string;
    config: ApiProcessorConfigType[];
    programId?: PublicKey;
}): Promise<TxWithSigner[]> => {
    let depositTransaction: Transaction[] = [];
    // console.log("Data.config", Data.config);
    let program: Program = getProgram({
        clusterOrUrl: Data.clusterOrUrl,
        programId: Data.programId,
    });
    // console.log("program", program);

    let lastWasCreateAccount = false;

    for (const item of Data.config) {
        switch (item.type) {
            case "createAssociatedTokenAccountInstruction":
                // console.log("data", item.data);
                let createAssociatedTokenAccountInstructionix =
                    createAssociatedTokenAccountInstruction(
                        new PublicKey(item.data.payer),
                        new PublicKey(item.data.associatedToken),
                        new PublicKey(item.data.owner),
                        new PublicKey(item.data.mint)
                    );
                console.log("create ATA");
                if (lastWasCreateAccount === true) {
                    console.log("added to previous Tx");
                    depositTransaction[depositTransaction.length - 1].add(
                        createAssociatedTokenAccountInstructionix
                    );
                } else {
                    depositTransaction.push(
                        new Transaction().add(createAssociatedTokenAccountInstructionix)
                    );
                }
                lastWasCreateAccount = true;
                break;
            case "depositNft":
                // console.log("depositNft"); //, item.data);

                let depositNftIx = await program.methods
                    .depositNft(Buffer.from(item.data.arguments.SDA_seed))
                    .accounts({
                        systemProgram: new PublicKey(item.data.accounts.systemProgram),
                        metadataProgram: new PublicKey(item.data.accounts.metadataProgram),
                        sysvarInstructions: new PublicKey(item.data.accounts.sysvarInstructions),
                        splTokenProgram: new PublicKey(item.data.accounts.splTokenProgram),
                        splAtaProgram: new PublicKey(item.data.accounts.splAtaProgram),
                        swapDataAccount: new PublicKey(item.data.accounts.swapDataAccount),
                        signer: new PublicKey(item.data.accounts.signer),
                        itemFromDeposit: new PublicKey(item.data.accounts.itemFromDeposit),
                        mint: new PublicKey(item.data.accounts.mint),
                        nftMetadata: new PublicKey(item.data.accounts.nftMetadata),
                        itemToDeposit: new PublicKey(item.data.accounts.itemToDeposit),
                        nftMasterEdition: new PublicKey(item.data.accounts.nftMasterEdition),
                        ownerTokenRecord: new PublicKey(item.data.accounts.ownerTokenRecord),
                        destinationTokenRecord: new PublicKey(
                            item.data.accounts.destinationTokenRecord
                        ),
                        authRulesProgram: new PublicKey(item.data.accounts.authRulesProgram),
                        authRules: new PublicKey(item.data.accounts.authRules),
                    })
                    .instruction();

                console.log("deposit Nft");

                if (lastWasCreateAccount === true) {
                    console.log("added to previous Tx");
                    depositTransaction[depositTransaction.length - 1].add(depositNftIx);
                    // depositTransaction.push(new Transaction());
                    lastWasCreateAccount = false;
                } else {
                    depositTransaction.push(new Transaction().add(depositNftIx));
                }

                break;
            case "depositCNft":
                // console.log("depositNft"); //, item.data);

                let depositCNftIx = await program.methods
                    .depositCNft(
                        Buffer.from(item.data.arguments.seed),
                        decode(item.data.arguments.root),
                        decode(item.data.arguments.dataHash),
                        decode(item.data.arguments.creatorHash),
                        new BN(item.data.arguments.nonce),
                        item.data.arguments.index
                    )
                    .accounts({
                        metadataProgram: item.data.accounts.metadataProgram,
                        sysvarInstructions: item.data.accounts.sysvarInstructions,
                        splTokenProgram: item.data.accounts.splTokenProgram,
                        splAtaProgram: item.data.accounts.splAtaProgram,
                        swapDataAccount: item.data.accounts.swapDataAccount,
                        user: item.data.accounts.user,
                        leafDelegate: item.data.accounts.leafDelegate,
                        treeAuthority: item.data.accounts.treeAuthority,
                        merkleTree: item.data.accounts.merkleTree,
                        logWrapper: item.data.accounts.logWrapper,
                        compressionProgram: item.data.accounts.compressionProgram,
                        bubblegumProgram: item.data.accounts.bubblegumProgram,
                    })
                    .remainingAccounts(getProofMeta(item.data.remainingAccounts))
                    .instruction();

                console.log("deposit CNft");

                depositTransaction.push(new Transaction().add(depositCNftIx));

                break;
            case "depositSol":
                // console.log("depositSol"); //, item.data);
                let depositSolIx = await program.methods
                    .depositSol(Buffer.from(item.data.arguments.SDA_seed))
                    .accounts({
                        systemProgram: new PublicKey(item.data.accounts.systemProgram),
                        splTokenProgram: new PublicKey(item.data.accounts.splTokenProgram),
                        swapDataAccount: new PublicKey(item.data.accounts.swapDataAccount),
                        swapDataAccountAta: new PublicKey(item.data.accounts.swapDataAccountAta),
                        signer: new PublicKey(item.data.accounts.signer),
                        signerAta: new PublicKey(item.data.accounts.signerAta),
                    })
                    .instruction();
                console.log("deposit Sol");
                if (lastWasCreateAccount === true) {
                    console.log("added to previous Tx");
                    depositTransaction[depositTransaction.length - 1].add(depositSolIx);
                    // depositTransaction.push(new Transaction());
                    lastWasCreateAccount = false;
                } else {
                    depositTransaction.push(new Transaction().add(depositSolIx));
                }
                lastWasCreateAccount = false;

                break;
            default:
                throw { message: "function not found" };
        }
    }

    // console.log("depositTransaction", depositTransaction);
    let txWithoutSigner: TxWithSigner[] = [];
    depositTransaction.map((tx) => txWithoutSigner.push({ tx: tx } as TxWithSigner));

    return txWithoutSigner;
};

