import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

// import { neoTypes, neoSwap } from "@neoswap/solana";
import { neoTypes, neoSwap } from "../src/index";

// @ts-ignore
import signerSK from "PATH_TO_SIGNER_SK";
const signer = Keypair.fromSecretKey(signerSK);
// @ts-ignore
import user1Sk from "PATH_TO_USER1_SK";
const user1 = Keypair.fromSecretKey(user1Sk);
// @ts-ignore
import user2Sk from "PATH_TO_USER2_SK";
const user2 = Keypair.fromSecretKey(user2Sk);

const mint1 = "YOUR_MINT1_ADDRESS";
const mint2 = "YOUR_MINT2_ADDRESS";
const mint3 = "YOUR_MINT3_ADDRESS";
const mint4 = "YOUR_MINT4_ADDRESS";
const mint5 = "YOUR_MINT5_ADDRESS";

let amountToSend = 1000000;

let clusterOrUrl = "YOUR_SOLANA_RPC_URL_OR_CLUSTER";

let swapInfo: neoTypes.SwapInfo = {
    currency: SystemProgram.programId.toBase58(),
    preSeed: "PRESEED_MAX_30_CHAR",
    users: [
        {
            address: user1.publicKey.toBase58(),
            items: {
                give: [
                    {
                        address: mint1,
                        amount: 1,
                        getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                    },
                    {
                        address: mint2,
                        amount: 1,
                        getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                    },
                ],
                get: [
                    {
                        address: mint3,
                        amount: 1,
                        givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                    },
                    {
                        address: mint4,
                        amount: 1,
                        givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                    },
                    {
                        address: mint5,
                        amount: 1,
                        givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                    },
                ],
                token: { amount: amountToSend },
            },
        },
        {
            address: user2.publicKey.toBase58(),
            items: {
                give: [
                    {
                        address: mint3,
                        amount: 1,
                        getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                    },
                    {
                        address: mint5,
                        amount: 1,
                        getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                    },
                    {
                        address: mint4,
                        amount: 1,
                        getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                    },
                ],
                get: [
                    {
                        address: mint1,
                        amount: 1,
                        givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                    },
                    {
                        address: mint2,
                        amount: 1,
                        givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                    },
                ],
                token: { amount: -amountToSend },
            },
        },
    ],
};

console.log("Initializing SWAP with data :", swapInfo);

/// INITIALIZE SWAP
const allInitData = await neoSwap.initializeSwap({
    clusterOrUrl,
    signer,
    swapInfo,
    simulation: false,
    skipConfirmation: false,
});
let swapDataAccount = allInitData.initializeData.swapIdentity.swapDataAccount_publicKey;
console.log("initialized", allInitData);

/// CHECK SWAP DATA
const swapdaata = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
    swapDataAccount_publicKey: swapDataAccount,
});

console.log("swapdaata", swapdaata);

/// DEPOSTI EACH USER

let data: { user: PublicKey; hashs: string[] }[] = [];
await Promise.all(
    [user1, user2].map(async (user) => {
        try {
            /// DEPOSIT SWAP Version 1
            const depositSwapDatauserHashs1 = await neoSwap.depositSwap({
                clusterOrUrl,
                signer: user,
                swapDataAccount,
            });

            /// DEPOSIT SWAP Version 2
            const depositSwapDatauserCreateIx =
                await neoSwap.CREATE_INSTRUCTIONS.createDepositSwapInstructions({
                    clusterOrUrl,
                    user: user.publicKey,
                    swapDataAccount,
                    // simulation: false,
                });

            const depositSwapDatauserHashs2 = await neoSwap.UTILS.sendBundledTransactions({
                clusterOrUrl,
                signer: user,
                txsWithoutSigners: depositSwapDatauserCreateIx,
            });

            /// DEPOSIT SWAP Version 3
            const depositSwapDatauserprep =
                await neoSwap.CREATE_INSTRUCTIONS.prepareDepositSwapInstructions({
                    clusterOrUrl,
                    swapDataAccount,
                    user: user.publicKey,
                });

            const depositSwapDatauserHashs3 = await neoSwap.apiProcessor({
                apiProcessorData: depositSwapDatauserprep[0],
                clusterOrUrl,
                signer: user,
                simulation: false,
            });

            /// Store Hashs
            data.push({ user: user.publicKey, hashs: depositSwapDatauserHashs1 }); //2 or 3
            console.log("transactionhashes", depositSwapDatauserHashs1);
        } catch (error) {
            data.push({ user: user.publicKey, hashs: error });
        }
    })
);

/// Print Hashs
data.forEach((v) => console.log(v.user.toBase58(), "\ndeposit datas :", v.hashs));

/// IF ALL CANCEL SWAP
const cancelAndCloseHash = await neoSwap.cancelAndCloseSwap({
    signer, // or User
    clusterOrUrl,
    swapDataAccount,
    simulation: false,
    skipConfirmation: false,
    skipFinalize: false,
});

console.log("cancelAndCloseHash :", cancelAndCloseHash);

/// IF ALL CLAIM SWAP
const claimAndCloseHash = await neoSwap.claimAndCloseSwap({
    signer, // or User
    clusterOrUrl,
    swapDataAccount,
    simulation: false,
    skipConfirmation: false,
    skipFinalize: false,
});

console.log("claimAndCloseHash :", claimAndCloseHash);
