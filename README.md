<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://neoswap.ai/wp-content/uploads/2022/08/logo-small-2.png">
    <img src="https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=200" alt="Logo">
  </a>

  <h3 align="center">NeoSwap Solana Package</h3>

</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>

    </li>
    <li>
      <a href="#Install-NPM-package">Installation</a>

    </li>
    <li><a href="#usage">Usage</a></li>

  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

[Neoswap Website](https://neoswap.xyz/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Install NPM package

```sh
npm install @neoswap/solana
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

# Usage

## Types

SwapIdentity represents the Identity of the swap

```ts
type SwapIdentity = {
    swapDataAccount_publicKey: PublicKey; // PublicKey of the swapDataAccount
    swapDataAccount_seed: Buffer; // Seed in Buffer format of the Swap
    swapDataAccount_seedString: string; // Seed in String format of the Swap
    swapDataAccount_bump: number; // Bump of the PDA
    swapData: SwapData; // Data of the swapDataAccount
};
```

SwapData represents the data of the swap

```ts
type SwapData = {
    initializer: PublicKey;
    status: number;
    nbItems: number;
    preSeed: string;
    items: Array<NftSwapItem>;
    acceptedPayement: PublicKey;
};
```

NftSwapItem represents the data of one Item in SwapData

```ts
type NftSwapItem = {
    isNft: boolean;
    mint: PublicKey;
    amount: BN;
    owner: PublicKey;
    destinary: PublicKey;
    status: number;
};
```

InitializeData represents the data after initializing the swap

```ts
type InitializeData = {
    programId: string; // ProgramId of the solana program the swap is being deployed to
    swapIdentity: neoTypes.SwapIdentity; // Object containing most relevant information of the swap
    txWithoutSigner: neoTypes.TxWithSigner[]; // Array of transactions to broadcast with empty Signer
};
```

TxWithSigner is an array of transaction to be broadcasted using sendAll method from anchor library

```ts
type TxWithSigner = { tx: Transaction; signers?: Signer[] };
```

## Error Type

ErrorFeedback represents the feedback thrown when an error is found

```ts
type ErrorFeedback = {
    blockchain: "solana";
    status: "error";
    message: string | unknown;
    swapStatus?: number;
};
```

## Status

### Swap

```
TradeStatus:
    0 => Initializing
    1 => WaitingToDeposit
    2 => WaitingToClaim
    3 => Closed

    100 => Canceling
    101 => Canceled
```

### Items

```
ItemStatus :
    10 => NFTPending
    11 => SolPending

    20 => NFTDeposited
    21 => SolDeposited
    22 => SolToClaim

    30 => NFTClaimed
    31 => SolClaimed

    100 => NFTcanceled
    101 => Solcanceled

    110 => NFTcanceledRecovered
    111 => SolcanceledRecovered
```

## Create Swap

### With signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const initializeData: {
    initializeData: InitializeData; // Data after initializing the swap
    transactionHashs: string[]; // Array of string containing the hashes of the executed transactions
} = await neoSwap.initializeSwap({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapPublicId: string, // IdentityString of the Swap
    signer: Keypair, // Wallet that will Create the swap and be admin of the swap
    swapData: neoTypes.swapData, // Data of the swap
    simulation: Option<boolean>, // default skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
    skipConfirmation: Option<boolean>, // default iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
});
```

### Without signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const initializeSwapData: {
    initializeData: InitializeData; // Data after initializing the swap
} = await neoSwap.CREATE_INSTRUCTIONS.createInitializeSwapInstructions({
    clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
    swapData: neoTypes.swapData, // Data of the swap
    signer: PublicKey, // Wallet that will Create the swap and be admin of the swap
});

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < initializeSwapData.transactions.length; index++) {
    const transaction = initializeSwapData.transactions[index].tx;

    const hash = await provider.sendAndConfirm(transaction);
}
```

## Deposit Swap

### With signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const depositSwapHashes: string[] = // Array of confirmed transaction Hashes
    await neoSwap.depositSwap({
        clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
        swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
        signer: Keypair, // Wallet that will deposit in the swap
        simulation: Option<boolean>, // OPTIONAL default: skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
        skipConfirmation: Option<boolean>, // OPTIONAL default: iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
    });
```

### Without signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const transactionsWithoutSigners: neoTypes.TxWithSigner[] =
    await neoSwap.CREATE_INSTRUCTIONS.createDepositSwapInstructions({
        clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
        swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
        user: PublicKey, // User that will deposit assets in the swap
    });

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < transactionsWithoutSigners.length; index++) {
    const transaction = transactionsWithoutSigners[index].tx;

    const hash = await provider.sendAndConfirm(transaction);
}
```

## Claim Swap (requires to be admin)

### With signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const claimAndCloseSwapHashes: string[] = // Array of confirmed transaction Hashes
    await neoSwap.claimAndCloseSwap({
        clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
        swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
        signer: Keypair, // Wallet admin of swap
        simulation: Option<boolean>, // OPTIONAL default: skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
        skipConfirmation: Option<boolean>, // OPTIONAL default: iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
    });
```

### Without signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const transactionsWithoutSigners: neoTypes.TxWithSigner[] =
    await neoSwap.CREATE_INSTRUCTIONS.createClaimSwapInstructions({
        clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
        swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
        signer: PublicKey, // Wallet admin of swap
    });

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < transactionsWithoutSigners.length; index++) {
    const transaction = transactionsWithoutSigners[index].tx;

    const hash = await provider.sendAndConfirm(transaction);
}
```

## Cancel Swap (requires to be admin to finish closing accounts)

Can only be cancelled when swap is initialized (status: TradeStatus.WaitingToDeposit = 1)

If the signer is the Initializer, it will cancel all items (or remaining ones) and close the PDA

If signer is User, it will cancel his item ancd change the swap state to TradeStatus.Canceling (100)

### With signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const cancelAndCloseSwapHashes: string[] = // Array of confirmed transaction Hashes
    await neoSwap.cancelAndCloseSwap({
        clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
        swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
        signer: Keypair, // Wallet admin of swap OR User that want to cancel his item
        simulation: Option<boolean>, // OPTIONAL default: skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
        skipConfirmation: Option<boolean>, // OPTIONAL default: iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
    });
```

### Without signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";

const transactionsWithoutSigners: neoTypes.TxWithSigner[] =
    await neoSwap.CREATE_INSTRUCTIONS.createCancelSwapInstructions({
        clusterOrUrl: string, // "mainnet-beta" or "devnet" or URL
        swapDataAccount: PublicKey, // PublicKey of the PDA swapDataAccount
        signer: PublicKey, // Wallet admin of swap OR User that want to cancel his item
    });

const provider = await getProvider(); //Import your own provider to broadcast transaction to blockchain via the user Wallet

for (let index = 0; index < transactionsWithoutSigners.length; index++) {
    const transaction = transactionsWithoutSigners[index].tx;

    const hash = await provider.sendAndConfirm(transaction);
}
```

## Broadcasting Transaction to blockchain using NeoSwap package and signer

```ts
import { neoSwap, neoTypes } from "@neoswap/solana";
import { Transaction, Keypair } from "@solana/web3.js";

const txsWithoutSigners: neoTypes.TxWithSigner[] = { tx: new Transaction().add(...transactionInstructions) };

const hashArray: string[] = await neoSwap.UTILS.sendBundledTransactions({
    clusterOrUrl: string,                       // "mainnet-beta" or "devnet" or URL
    signer: Keypair,                            // Keypair of the wallet signing the transaction
    txsWithoutSigners: neoTypes.TxWithSigner[], // Array of transactions with empty Signer
    simulation: Option<boolean>,                // OPTIONAL default skip simulation and broadcast to blockchain (recommanded). If true: make simulation of the transactions before broadcasting them
    skipConfirmation: Option<boolean>,          // OPTIONAL default iterates through the transactions to confirm status (return error if one fails with array of transactionhashes). If true: skip confirmation
});
```

<!-- MARKDOWN LINKS & IMAGES -->

[neoswap-app]: https://www.neoswap.xyz
[neoswap-logo2]: https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=200
[neoswap-logo]: https://neoswap.xyz/static/media/logo.9762f0998529b1eaed83aee714bcb7cd.svg
