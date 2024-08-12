const {bs58} = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
const {keccak_256} = require("js-sha3");
const {PublicKey} = require("@solana/web3.js");
function hashv(a: string, b: string) {
    return bs58.encode(
        Buffer.from(
            keccak_256.digest(
                Buffer.concat([new PublicKey(a).toBuffer(), new PublicKey(b).toBuffer()])
            )
        )
    );
}
async function test() {
    // token0 leaf1 xGkv3nrcLwgS3DE1wm4gRsYcPadZ494s8PfMXp2qWod
    // token1 leaf0 8Yjb882UgJRziAH1hTi2Tve2e6T2o9kRhGZAxrE6Y6pG
    // token2 node(10) 5EyMYRF4vNpfufFW95h1rESBTH5piu4oTRdG7QihvUz6

    console.log(
        hashv(
            "xGkv3nrcLwgS3DE1wm4gRsYcPadZ494s8PfMXp2qWod",
            "8Yjb882UgJRziAH1hTi2Tve2e6T2o9kRhGZAxrE6Y6pG"
        ),
        hashv(
            "8Yjb882UgJRziAH1hTi2Tve2e6T2o9kRhGZAxrE6Y6pG",
            "xGkv3nrcLwgS3DE1wm4gRsYcPadZ494s8PfMXp2qWod"
        ),
        "5EyMYRF4vNpfufFW95h1rESBTH5piu4oTRdG7QihvUz6"
    );
    // await testMakeSwap(envOpts, connection).then((res) => {
    //     final.push(res);
    // });

    // console.log("final", final);
}

test();
