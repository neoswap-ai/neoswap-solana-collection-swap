<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://neoswap.ai/wp-content/uploads/2022/08/logo-small-2.png">
    <img src="https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=200" alt="Logo">
  </a>

  <h3 align="center">NeoSwap Solana Collection Swap Package</h3>

</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <a href="#Install-NPM-package">Install NPM package</a>

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
npm install @neoswap/solana-collection-swap
```

## Types

### represents the data type in the program

```js
type SwapData = {
    maker: string, // maker public key
    nftMintMaker: string, // nft mint of the maker

    bids: Bid[], // array of bids to initiate with ( max 15 )

    taker?: string, // taker public key
    nftMintTaker?: string, // nft mint of the taker
    acceptedBid?: Bid, // accepted bid

    refererMaker?: string, // unused
    refererTaker?: string, // unused

    endTime: number, // date when the swap gets obsolete

    royaltiesPaidMaker: boolean, // royalties paid for maker NFT
    royaltiesPaidTaker: boolean, // royalties paid for taker NFT
    claimed: boolean, // is swap claimed

    status: "active" | "expired" | "accepted",
    paymentMint: string, // mint of the payment token
};

type Bid = {
    collection: string,
    amount: number,
    makerNeoswapFee: number,
    takerNeoswapFee: number,
    takerRoyalties: number,
    makerRoyalties: number,
};
```

```js
type BundleTransaction = {
    tx: Transaction | VersionedTransaction, // transaction object
    stx: Transaction | VersionedTransaction, // signed transaction object
    details: MakeSArg | TakeSArg | ClaimSArg | UpdateSArgs | RmBidArgs | SetNewTime, // arguments passed to the package to construct the transactions
    blockheight?: number, // signature blockheight
    description: string, // description of the transaction
    priority: number, // order of the transactions 0 means should be sent first
    status: "pending" | "broadcast" | "success" | "failed" | "Timeout",
    hash?: string,
    failedReason?: string,
    retries?: number,
};
```

### Every function in CREATE_INSTRUCTIONS also expects these parameters

```js
type EnvOpts = {
    clusterOrUrl?: Cluster | string, // cluster or url to construct connection ( default is mainnet )
    program?: Program<CollectionSwap>, // if you want to pass your own program
    programId?: string, // if you want to use a different program id
    idl?: Idl | true, // if you want to use your own idl, true willl fetch the onchain IDL
    prioritizationFee?: number, // if a prioritization fee is to be added to the transaction
};
```

# Example Usage

### Imports

You can also find imports in a destructured way accessible in the package

```js
import { UTILS, CREATE_INSTRUCTIONS as CI, TYPES } from "@neoswap/solana-collection-swap";
```

### Create Swap BundleTransaction

```js
let initData = await CI.createMakeSwapInstructions({
    maker: string;
    nftMintMaker: string;
    paymentMint: string;
    bids: Bid[];
    endDate: number;
});
```

### Add bid to Swap

```js
let addBT = await CI.createAddBidBt({
    bids: Bid[];
    swapDataAccount: string;
    maker: string;
});
```

### Remove bid to Swap

```js
let rmBT = await CI.createRmBidBt({
    rmBids: Bid[];
    swapDataAccount: string;
    maker: string;
});
```

### Set new time for Swap

```js
let setNewTimeBT = await CI.createSetNewTime({
    swapDataAccount: string;
    newTime: number;
    maker: string;
});
```

### Take and claim Swap

```js
let takeData = await CI.createTakeAndCloseSwapInstructions({
    swapDataAccount: string;
    taker: string;
    signer?: string; // if you want to finalize the swap on behalf of the taker
    nftMintTaker: string;
    bid: Bid;
    verifyTaker?: boolean; // if you want to make sure the taker is the one who is taking the swap
    unwrap?:boolean // if wrappedSol is to be unwrapped
});
```

### Cancel swap and refund maker

```js
let cancelBT = await CI.createCancelSwapInstructions({
    signer,
    swapDataAccount,
});
```

## How to process the bundle transaction

```js
let BT : BundleTransaction[];
// BT will be updated with most recent information
BT = await UTILS.sendBundledTransactionsV2({
          bundleTransactions: BT,
          signer?, // should be a keypair if not provided, function expects the transaction stx to be already signed
          clusterOrUrl?, // provide or RPC or connection
          connection?,
          commitment?,
          prioritizationFee?,
          retryDelay?,
          skipSimulation?,
          skipConfirmation?,
        })
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[neoswap-app]: https://www.neoswap.xyz
[neoswap-logo2]: https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=200
[neoswap-logo]: https://neoswap.xyz/static/media/logo.9762f0998529b1eaed83aee714bcb7cd.svg
