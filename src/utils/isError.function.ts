import { TransactionInstruction } from "@solana/web3.js";
import { ApiProcessorData, ErrorFeedback, SwapIdentity, TxWithSigner } from "./types";

// export const isErrorTxSigner = (obj: TxWithSigner | ErrorFeedback): obj is ErrorFeedback =>
//     Object.keys(obj[0]).includes("type");

// export const isErrorInitTx = (
//     obj:
//         | {
//               swapIdentity: SwapIdentity;
//               programId: string;
//               transactions: TxWithSigner;
//           }
//         | { programId: string; swapIdentity?: SwapIdentity; error: ErrorFeedback }
// ): obj is {
//     programId: string;
//     swapIdentity?: SwapIdentity;
//     error: ErrorFeedback;
// } => Object.keys(obj).includes("error");

// export const isErrorAddInit = (
//     obj: ErrorFeedback | TransactionInstruction[][]
// ): obj is ErrorFeedback => Object.keys(obj[0]).includes("type");

// export const isErrorInitializeSwap = (
//     obj:
//         | {
//               programId: string;
//               swapIdentity: SwapIdentity;
//               transactionHashes: string[];
//           }
//         | {
//               programId: string;
//               swapIdentity?: SwapIdentity;
//               error: ErrorFeedback;
//           }
// ): obj is { programId: string; swapIdentity?: SwapIdentity; error: ErrorFeedback } =>
//     Object.keys(obj).includes("error");

// export const isErrorApiProcessor = (obj: ErrorFeedback | ApiProcessorData): obj is ErrorFeedback =>
//     !Object.keys(obj[0]).includes("config");

// export const isError = (obj: ErrorFeedback | string[]): obj is ErrorFeedback =>
//     Object.keys(obj[0]).includes("type");
