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

### Types

represents the data type in the program

```js
type SwapData = {
    maker: string,
    nftMintMaker: string,

    bids: Bid[],

    taker?: string,
    nftMintTaker?: string,
    acceptedBid?: Bid,

    refererMaker?: string,
    refererTaker?: string,

    endTime: number,

    royaltiesPaidMaker: boolean,
    royaltiesPaidTaker: boolean,
    claimed: boolean,

    status: "active" | "expired" | "accepted",
    paymentMint: string,
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

### Example Usage

## Imports

ypu can also find imports in a destructured way

```js
import { UTILS, CREATE_INSTRUCTIONS, TYPES } from "@neoswap/solana-collection-swap";
```

## Create Swap BundleTransaction

```js
let initData = await CI.createMakeSwapInstructions({
    maker: makerKp.publicKey.toString(),
    bids,
    endDate,
    nftMintMaker,
    paymentMint,
    clusterOrUrl: connection.rpcEndpoint,
    programId,
});
```

````js
let addBT = await CI.createAddBidBt({
  maker: makerKp.publicKey.toString(),
  bids,
  swapDataAccount,
  clusterOrUrl: connection.rpcEndpoint,
  programId,
});
  ```
```js
  let rmBT = await CI.createRmBidBt({
  maker: makerKp.publicKey.toString(),
  rmBids: bids,
  swapDataAccount,
  clusterOrUrl: connection.rpcEndpoint,
  programId,
});
  ```
```js
  let setNewTimeBT = await CI.createSetNewTime({
  maker: makerKp.publicKey.toString(),
  swapDataAccount,
  newTime,
  clusterOrUrl: connection.rpcEndpoint,
  programId,
});

````

```js
let takeData = await CI.createTakeAndCloseSwapInstructions({
    swapDataAccount,
    taker: takerKp.publicKey.toString(),
    n,
    bid,
    nftMintTaker,
    clusterOrUrl: connection.rpcEndpoint,
    unwrap: false,
});
```

```js
let cancelBT = await CI.createCancelSwapInstructions({
    signer: signerKp.publicKey.toString(),
    swapDataAccount,
    clusterOrUrl: connection.rpcEndpoint,
    programId,
});
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>
TODO


<!-- MARKDOWN LINKS & IMAGES -->

[neoswap-app]: https://www.neoswap.xyz
[neoswap-logo2]: https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=200
[neoswap-logo]: https://neoswap.xyz/static/media/logo.9762f0998529b1eaed83aee714bcb7cd.svg
