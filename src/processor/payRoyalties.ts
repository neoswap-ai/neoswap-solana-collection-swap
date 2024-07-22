// import { Keypair } from "@solana/web3.js";
// import { BundleTransaction, ClaimSArg, ErrorFeedback, OptionSend } from "../utils/types";
// import { sendSingleBundleTransaction } from "../utils/sendSingleTransaction.function";
// import { createPayRoyaltiesInstructions } from "../programInstructions/payRoyalties.instructions";
// import { checkEnvOpts, checkOptionSend, getClaimSArgs } from "../utils/check";

// export async function payRoyalties(
//     Data: OptionSend &
//         Omit<ClaimSArg, "signer"> & {
//             signer: Keypair;
//         }
// ): Promise<BundleTransaction> {
//     let cOptionSend = checkOptionSend(Data);
//     let cEnvOpts = await checkEnvOpts(Data);
//     let ClaimSArgs = getClaimSArgs(Data);

//     try {
//         return await sendSingleBundleTransaction({
//             ...cOptionSend,
//             signer: Data.signer,
//             bt: await createPayRoyaltiesInstructions({
//                 ...cEnvOpts,
//                 ...ClaimSArgs,
//             }),
//         });
//     } catch (error) {
//         throw {
//             blockchain: "solana",
//             message: Data.swapDataAccount.toString() + `- -\n` + error,
//             status: "error",
//         } as ErrorFeedback;
//     }
// }
