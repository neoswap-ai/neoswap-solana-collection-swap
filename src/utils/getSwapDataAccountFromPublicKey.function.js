async function getSwapDataAccountFromPublicKey(program, swapDataAccount_publicKey) {
    try {
        return await program.account.swapData.fetch(swapDataAccount_publicKey);
    } catch (error) {
        return undefined;
    }
}

module.exports = getSwapDataAccountFromPublicKey;
