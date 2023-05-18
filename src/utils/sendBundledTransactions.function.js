const getProgram = require("./getProgram.obj");

async function sendBundledTransactions(txWithSigners, cluster) {
    try {
        // console.log(txWithSigners);
        let { program } = getProgram(txWithSigners[0].signers[0], cluster);
        const transactionHashes = await program.provider.sendAll(txWithSigners, {
            // skipPreflight: true,
        });
        // console.log(transactionHashes);
        return { transactionHashes };
    } catch (error) {
        throw error;
    }
}
module.exports = sendBundledTransactions;
