import { hash as hashFunction } from "@project-serum/anchor/dist/cjs/utils/sha256";
import { Program, web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OrdinalsOffer } from "../../utils/types";

export const createNewOfferIx = async (params: { program: Program; offer: OrdinalsOffer }) => {
    const [adminPda, adminBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("admin")],
        params.program.programId
    );
    // console.log("adminPda", adminPda.toBase58());

    // const offer = await program.account.offer.fetch(new PublicKey(offerPdaGiven));
    // console.log("offer", params.offer);
    // console.log("sellerAddress", params.offer.sellerAddress.toString());
    // console.log("buyerAddress", params.offer.buyerAddress.toString());
    // console.log("bitcoinAddress", params.offer.bitcoinAddress);
    // console.log("ordinalsId", params.offer.ordinalsId);
    // console.log("tokenAccepted", params.offer.tokenAccepted.toString());
    // console.log("amount", params.offer.amount.toString());
    const offerSeed = Buffer.from(
        hashFunction(
            params.offer.sellerAddress.toString() +
                params.offer.buyerAddress.toString() +
                params.offer.bitcoinAddress +
                params.offer.ordinalsId +
                params.offer.tokenAccepted.toString() +
                params.offer.amount.toString()
        )
    ).subarray(0, 32);
    // console.log("offerSeed", offerSeed.toString());
    const [offerPda, offerBump] = PublicKey.findProgramAddressSync(
        [offerSeed],
        params.program.programId
    );

    console.log("XXX - create new offer - offerPda", offerPda.toBase58(), " - XXX");
    // console.log("REACT_APP_SOLANA_SPL_ATA", process.env.REACT_APP_SOLANA_SPL_ATA);
    return params.program.methods
        .createNewOffer(offerSeed, offerBump, adminBump, params.offer)
        .accounts({
            offerPda,
            adminPda,
            signer: params.program.provider.publicKey,
            systemProgram: web3.SystemProgram.programId,
            splTokenProgram: process.env.REACT_APP_SOLANA_SPL_ATA,
        })
        .instruction();
};
