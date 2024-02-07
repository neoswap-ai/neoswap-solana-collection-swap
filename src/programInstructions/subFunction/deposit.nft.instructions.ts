import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { findOrCreateAta } from "../../utils/findOrCreateAta.function";
import {
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    findNftDataAndMetadataAccount,
    findNftMasterEdition,
    findRuleSet,
    findUserTokenRecord,
} from "../../utils/findNftDataAndAccounts.function";

import { Program } from "@coral-xyz/anchor";
import { SwapIdentity } from "../../utils/types";
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
    // SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "../../utils/const";

import { errorIfInsufficientBalance } from "../../utils/errorIfInsufficientBalance.function";

export async function getDepositNftInstruction(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    amount: number;
    swapIdentity: SwapIdentity;
    ataList: string[];
}) {
    await errorIfInsufficientBalance({
        amount: Data.amount,
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
    });

    let instructions = [];
    let ataList = Data.ataList;
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 600000,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1,
    });
    instructions.push(modifyComputeUnits);
    instructions.push(addPriorityFee);
    const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
    });
    if (userAtaIx && !Data.ataList.includes(userAta.toBase58())) {
        instructions.push(userAtaIx);
        ataList.push(userAta.toBase58());
        console.log("createUserAta DepositNft Tx Added", userAta.toBase58());
    }

    const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
    });
    if (pdaAtaIx && !Data.ataList.includes(pdaAta.toBase58())) {
        instructions.push(pdaAtaIx);
        ataList.push(pdaAta.toBase58());
        console.log("createPdaAta DepositNft Tx Added", pdaAta.toBase58());
    }

    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        // metadataBump: nftMetadata_bump,
    } = await findNftDataAndMetadataAccount({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if New metaplex standard
        const nftMasterEdition = findNftMasterEdition({
            mint: Data.mint,
        });

        const ownerTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: userAta,
        });

        const destinationTokenRecord = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaAta,
        });

        const authRules = await findRuleSet({
            connection: Data.program.provider.connection,
            mint: Data.mint,
        });
        
        instructions.push(
            await Data.program.methods
                .depositPNft(Data.swapIdentity.swapDataAccount_seed)
                .accounts({
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    userAta: userAta.toBase58(),
                    swapDataAccountAta: pdaAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    systemProgram: SystemProgram.programId.toBase58(),
                })
                .instruction()
        );
    } else {
        instructions.push(
            await Data.program.methods
                .depositPNft(Data.swapIdentity.swapDataAccount_seed)
                .accounts({
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    userAta: userAta.toBase58(),
                    swapDataAccountAta: pdaAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    nftMasterEdition: Data.signer.toBase58(),
                    ownerTokenRecord: Data.signer.toBase58(),
                    destinationTokenRecord: Data.signer.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: Data.signer.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    systemProgram: SystemProgram.programId.toBase58(),
                })
                .instruction()
        );
    }
    return { instructions, ataList };
}
