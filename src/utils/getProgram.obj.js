const idl = require("./neoSwap.idl");
const { PublicKey, Connection, clusterApiUrl } = require("@solana/web3.js");
const { Program, Wallet, AnchorProvider } = require("@project-serum/anchor");
const CONSTS = require("./const");

function getProgram(signer, cluster) {
    let clusterUrl = clusterApiUrl(cluster);
    if (cluster === "devnet")
        clusterUrl =
            "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
    const connection = new Connection(clusterUrl, "confirmed");

    const wallet = new Wallet(signer);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program(idl, new PublicKey(CONSTS.SWAP_PROGRAM_ID), provider);

    return { program };
}
module.exports = getProgram;
