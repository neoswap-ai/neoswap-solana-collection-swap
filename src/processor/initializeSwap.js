const createInitializeSwapInstructions = require("../programInstructions/createInitializeSwapInstructions");
const sendBundledTransactions = require("../utils/sendBundledTransactions.function");

async function initializeSwap(swapData, signer, cluster, preSeed) {
    const initSwapData = await createInitializeSwapInstructions(
        swapData,
        signer.publicKey,
        preSeed
    );
    // console.log("initSwapData", initSwapData);
    const transactionHashes = await sendBundledTransactions(
        initSwapData.transactions,
        signer,
        cluster
    );
    // console.log("transactionHashes", transactionHashes);
    return { ...initSwapData, transactionHashes };
}

module.exports = initializeSwap;
