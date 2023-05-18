const getProgram = require("./getProgram.obj");

async function sendBundledTransactions(txsWithoutSigners, signer, cluster) {
    try {
        // console.log(txWithSigners);
        let { program } = getProgram(cluster, signer);
        const txsWithSigners = await Promise.all(
            txsWithoutSigners.map((txWithoutSigners) => {
                txWithoutSigners.signers = [signer];
                txWithoutSigners.tx.feePayer = signer.publicKey;
                return txWithoutSigners;
            })
        );
        // console.log("txsWithSigners", txsWithSigners);
        const transactionHashes = await program.provider.sendAll(txsWithSigners, {
            // skipPreflight: true,
        });
        // console.log(transactionHashes);
        return { transactionHashes };
    } catch (error) {
        throw error;
    }
}
module.exports = sendBundledTransactions;
