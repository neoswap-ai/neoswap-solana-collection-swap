import { ErrorFeedback, SwapIdentity, TxWithSigner } from "./types";

export const isError = (obj: TxWithSigner | ErrorFeedback): obj is ErrorFeedback =>
    Object.keys(obj[0]).includes("type");

export const isErrorInit = (
    obj:
        | {
              swapIdentity: SwapIdentity;
              programId: string;
              transactions: TxWithSigner;
          }
        | ErrorFeedback
): obj is ErrorFeedback => !Object.keys(obj).includes("swapIdentity");
