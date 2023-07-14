import { BN, Idl, Program } from "@project-serum/anchor";
import {
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
} from "@solana/spl-token";
import { Cluster, PublicKey, Transaction } from "@solana/web3.js";
import { ApiProcessorConfigType, OrdinalsOffer, TxWithSigner } from "../utils/types";
import { getProgram } from "../utils/getProgram.obj";
import { createNewOfferIx } from "./subFunction/createNewOffer.instructions";
import { createDepositOrdinalIx } from "./subFunction/createDepositOrdinal.instruction";

export const apiProcessorTranscript = async (Data: {
    // getProgram: (programId: PublicKey, idl: Idl) => Promise<Program>;
    // clusterOrUrl: Cluster | string;
    config: ApiProcessorConfigType[];
    programId?: PublicKey;
}): Promise<TxWithSigner[]> => {
    let depositTransaction: Transaction[] = [];
    // console.log("Data.config", Data.config);
    let program: Program;
    let lastWasCreateAccount = false;
    for (const item of Data.config) {
        switch (item.type) {
            case "create-offer":
                console.log("OrdinalsOffer");
                const offer: OrdinalsOffer = {
                    sellerAddress: new PublicKey(item.sellerAddress),
                    buyerAddress: new PublicKey(item.buyerAddress),
                    bitcoinAddress: item.bitcoinAddress,
                    ordinalsId: item.ordinalsId,
                    cancelingTime: new BN(0),
                    status: 0,
                    tokenAccepted: new PublicKey(item.tokenAccepted),
                    amount: new BN(item.amount * 10 ** 9),
                    transferOrdinalsHash: item.transferOrdinalsHash,
                    neoswapFee: new BN(item.neoswapFee),
                };
                program = getProgram({
                    clusterOrUrl: "devnet",
                    programId: Data.programId,
                });

                let createOrdinalSwapIx = await createNewOfferIx({ program, offer });
                depositTransaction.push(new Transaction().add(createOrdinalSwapIx));

                let depositOrdinalIx = await createDepositOrdinalIx({ program, offer });
                depositTransaction[-1].add(...depositOrdinalIx);

                lastWasCreateAccount = false;
                break;

            case "unwrap-sol":
                // program = await Data.getProgram(new PublicKey(item.ordinalsSc), ordinalIdl);
                program = getProgram({
                    clusterOrUrl: "devnet",
                    programId: Data.programId,
                });
                let closeAccountIx = createCloseAccountInstruction(
                    new PublicKey(item.userAta),
                    new PublicKey(item.user),
                    new PublicKey(item.user)
                );
                console.log("unwrap sol");
                depositTransaction.push(new Transaction().add(closeAccountIx));
                lastWasCreateAccount = false;
                break;
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
                program = getProgram({ clusterOrUrl: "devnet" });
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

            case "depositSol":
                // console.log("depositSol"); //, item.data);
                program = getProgram({ clusterOrUrl: "devnet" });
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

// export default apiProcessorTranscript;
