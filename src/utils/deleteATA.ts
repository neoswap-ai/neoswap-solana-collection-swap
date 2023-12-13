

//   import { Cluster, Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

// import { idlSwap } from "./neoSwap.idl";
// import { Program, AnchorProvider } from "@coral-xyz/anchor";
// import { NEOSWAP_PROGRAM_ID, NEOSWAP_PROGRAM_ID_DEV } from "./const";
// import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
// import { createCloseAccountInstruction } from "@solana/spl-token";
// import { sendBundledTransactions } from "./sendBundledTransactions.function";

// export async function getProgram(Data: {
//     clusterOrUrl: Cluster | string;
//     programId?: PublicKey;
//     signer?: Keypair;
// }) {
//     let clusterUrl;
//     let programId_ = new PublicKey(NEOSWAP_PROGRAM_ID);

//     if (
//         Data.clusterOrUrl === "mainnet-beta" ||
//         Data.clusterOrUrl === "testnet" ||
//         Data.clusterOrUrl === "devnet"
//     ) {
//         clusterUrl = clusterApiUrl(Data.clusterOrUrl);
//     } else {
//         if (String(Data.clusterOrUrl).toLowerCase().includes("devnet") && !!!Data.programId) {
//             programId_ = new PublicKey(NEOSWAP_PROGRAM_ID_DEV);
//         }
//         clusterUrl = Data.clusterOrUrl;
//     }
//     // console.log("clusterUrl", clusterUrl);

//     const connection = new Connection(clusterUrl, "confirmed");
//     if (!Data.signer) Data.signer = Keypair.generate();
//     const wallet = new NodeWallet(Data.signer);

//     const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

//   return createCloseAccountInstruction(
//         Data.signer, // token account which you want to close
//         alice.publicKey, // destination
//         alice.publicKey // owner of token account
//       )

//     if (Data.programId) programId_ = new PublicKey(Data.programId);

//     const program = new Program(idl_, programId_, provider);
//     console.log("programId", program.programId.toBase58());

//     return program;
// }
