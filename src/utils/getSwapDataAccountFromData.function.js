const { PublicKey } = require("@solana/web3.js");
const { utils } = require("@project-serum/anchor");
const CONSTS = require("./const");

async function getSwapDataAccountFromData(swapData, preSeed) {
    // console.log(preSeed);
    try {
        if (!preSeed) preSeed = "0000";
        let seed = preSeed;

        swapData.items
            .sort((x, y) => {
                return (
                    x.mint.toString() +
                    x.owner.toString() +
                    x.destinary.toString()
                ).localeCompare(y.mint.toString() + y.owner.toString() + y.destinary.toString());
            })
            .forEach((item) => {
                seed += item.mint;
                seed += item.owner;
                seed += item.destinary;
            });

        let swapDataAccount_seed = Buffer.from(utils.sha256.hash(seed)).subarray(0, 32);

        const [swapDataAccount_publicKey, swapDataAccount_bump] = PublicKey.findProgramAddressSync(
            [swapDataAccount_seed],
            CONSTS.SWAP_PROGRAM_ID
        );

        return {
            swapDataAccount_publicKey,
            swapDataAccount_seed,
            swapDataAccount_bump,
            preSeed,
            swapData,
        };
    } catch (error) {
        throw error;
    }
}
module.exports = getSwapDataAccountFromData;
