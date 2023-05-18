const getProgram = require("../utils/getProgram.obj");
const getSwapDataAccountFromData = require("../utils/getSwapDataAccountFromData.function");
const { SystemProgram, Transaction } = require("@solana/web3.js");
const getSwapDataAccountFromPublicKey = require("../utils/getSwapDataAccountFromPublicKey.function");

async function createInitializeSwapInstructions(swapData, signer, preSeed, cluster) {
    if (!preSeed) preSeed = "0000";
    const { program } = getProgram(signer, cluster);

    const swapIdentity = await getSwapDataAccountFromData(swapData, preSeed);

    try {
        const initInstruction = await getInitInitilizeInstruction(program, swapIdentity, signer);
        const addInstructions = await getAddInitilizeInstructions(program, swapIdentity, signer);

        const validateInstruction = await getValidateInitilizeInstruction(
            program,
            swapIdentity,
            signer
        );

        let transactions = [];

        if (initInstruction) {
            transactions.push({
                tx: new Transaction().add(initInstruction),
                signers: [signer],
            });
        }

        if (addInstructions) {
            addInstructions.map((addInstruction) => {
                transactions.push({
                    tx: new Transaction().add(...addInstruction),
                    signers: [signer],
                });
            });
        } else {
            console.log("Adding Items to swap skipped");
        }

        if (validateInstruction) {
            transactions.push({
                tx: new Transaction().add(validateInstruction),
                signers: [signer],
            });
        } else {
            throw "nothing to initialize";
        }

        return {
            ...swapIdentity,
            programId: program.programId.toBase58(),
            transactions,
        };
    } catch (error) {
        throw {
            message: error,
            programId: program.programId.toBase58(),
            ...swapIdentity,
        };
    }
}
module.exports = createInitializeSwapInstructions;
async function getInitInitilizeInstruction(program, swapIdentity, signer) {
    let { status, initializer, items } = swapIdentity.swapData;
    const num_items = items.length;
    const initSwapData = {
        status,
        initializer,
        items: [],
    };

    const balanceSda = await program.provider.connection.getBalance(
        swapIdentity.swapDataAccount_publicKey
    );
    if (balanceSda === 0) {
        return program.methods
            .initInitialize(
                swapIdentity.swapDataAccount_seed,
                swapIdentity.swapDataAccount_bump,
                initSwapData,
                num_items
            )
            .accounts({
                swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
                signer: signer.publicKey.toBase58(),
                systemProgram: SystemProgram.programId.toBase58(),
                splTokenProgram: process.env.SOLANA_SPL_ATA_PROGRAM_ID,
            })
            .signers([signer])
            .instruction();
    } else {
        console.log("swap Account already initialized");
        return undefined;
    }
}

async function getAddInitilizeInstructions(program, swapIdentity, signer) {
    const bcData = await getSwapDataAccountFromPublicKey(
        program,
        swapIdentity.swapDataAccount_publicKey
    );

    let out = [];
    let chunkSize = 6;

    for (let index = 0; index < swapIdentity.swapData.items.length; index += chunkSize) {
        const chunkIx = [];
        await Promise.all(
            swapIdentity.swapData.items.slice(index, index + chunkSize).map(async (item) => {
                let addTx = true;
                if (bcData) {
                    bcData.items.forEach((itemSDA) => {
                        if (
                            itemSDA.mint.equals(item.mint) ||
                            itemSDA.owner.equals(item.owner) ||
                            itemSDA.destinary.equals(item.destinary)
                        ) {
                            // console.log("already there");
                            addTx = false;
                        }
                    });
                }

                if (addTx) {
                    chunkIx.push(
                        await program.methods
                            .initializeAdd(
                                swapIdentity.swapDataAccount_seed,
                                swapIdentity.swapDataAccount_bump,
                                item
                            )
                            .accounts({
                                swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
                                signer: signer.publicKey.toBase58(),
                            })
                            .signers([signer])
                            .instruction()
                    );
                }
            })
        );
        if (chunkIx) out.push(chunkIx);
    }

    if (out.length > 0) return out;
    return undefined;
}

async function getValidateInitilizeInstruction(program, swapIdentity, signer) {
    return program.methods
        .validateInitialize(swapIdentity.swapDataAccount_seed, swapIdentity.swapDataAccount_bump)
        .accounts({
            swapDataAccount: swapIdentity.swapDataAccount_publicKey.toBase58(),
            signer: signer.publicKey.toBase58(),
        })
        .signers([signer])
        .instruction();
}
