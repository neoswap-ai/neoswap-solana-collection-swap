import { Idl } from "@coral-xyz/anchor";
export const idlSwap: Idl = {
    version: "0.1.0",
    name: "neo_swap",
    docs: ["@title List of function to manage NeoSwap's multi-items swaps"],
    instructions: [
        {
            name: "initializeInit",
            docs: [
                "@notice Initialize Swap's PDA. /!\\ Signer will be Initializer",
                "@dev First function to trigger to initialize Swap's PDA with according space, define admin and add Neoswap Fees. /!\\ Signer will be Initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@param sent_data: SwapData: {initializer: Pubkey => admin of the trade, status: u8  => "status of the trade", items: NftSwapItem = first item [length=1]}, nb_of_items: u32 => number of items engaged in the trade}',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts signer: Pubkey => initializer",
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts token_program: Pubkey = spl_associated_token_program_id",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "sentData",
                    type: {
                        defined: "SwapData",
                    },
                },
            ],
        },
        {
            name: "initializeAddToken",
            docs: [
                "@notice add item to Swap's PDA. /!\\ initializer function",
                "@dev Function to add an item to the PDA. /!\\ status of item is rewritten to according value in program.  /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@param trade_to_add: NftSwapItem: {is_nft: bool => "return true if the item is en NFT (true)/(false)", mint: Pubkey => "(Mint address)/(Owner address)", amount: i64 => (nbr of NFT engaged in this trade)/(number of lamports the user will exchange with the smart contract if_positive(user will give lamports), if_negative(user will receive lamports)), owner: Pubkey => owner of the NFT or lamports , destinary: Pubkey => (user who should receive the NFT)/(Owner address), status : u8 => /!\\ will be rewritten by program, }',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts signer: Pubkey => initializer",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "tradeToAdd",
                    type: {
                        defined: "TokenSwapItem",
                    },
                },
            ],
        },
        {
            name: "initializeAddNft",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "tradeToAdd",
                    type: {
                        defined: "NftSwapItem",
                    },
                },
            ],
        },
        {
            name: "initializeValidate",
            docs: [
                "@notice Verify Swap's PDA items to proceed to waiting for deposit state. /!\\ initializer function",
                "@dev Function verify each item status and sum of lamports to mutate the smart contract status to (waiting for deposit).",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts signer: Pubkey => initializer",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
            ],
        },
        {
            name: "initializeModifyToken",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "tradeToModify",
                    type: {
                        defined: "TokenSwapItem",
                    },
                },
            ],
        },
        {
            name: "initializeModifyPnft",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "collectionPda",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMetadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "tradeToModify",
                    type: {
                        defined: "NftSwapItem",
                    },
                },
                {
                    name: "isMaker",
                    type: "bool",
                },
            ],
        },
        {
            name: "initializeModifyCnft",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "collectionPda",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "leafDelegate",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "treeAuthority",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "merkleTree",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "logWrapper",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "compressionProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "bubblegumProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "tradeToModify",
                    type: {
                        defined: "NftSwapItem",
                    },
                },
                {
                    name: "isMaker",
                    type: "bool",
                },
            ],
        },
        {
            name: "depositPNft",
            docs: [
                "@notice Deposit NFT to escrow.",
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow.",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts {system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id, swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => User that deposits,  item_from_deposit: Pubkey => User ATA related to mint, item_to_deposit: Pubkey => Swap's PDA ATA related to mint}",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "userAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEdition",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ownerTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "destinationTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "authRules",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
            ],
        },
        {
            name: "depositCNft",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "leafDelegate",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "treeAuthority",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "merkleTree",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "logWrapper",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "compressionProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "bubblegumProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "root",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "dataHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "creatorHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "nonce",
                    type: "u64",
                },
                {
                    name: "index",
                    type: "u32",
                },
            ],
        },
        {
            name: "depositSol",
            docs: [
                "@notice Deposit lamports to escrow.",
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposits lamports to escrow. /!\\ user that should only receive lamports don't have to deposit.",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts signer: Pubkey => User that deposits",
                "@return Void",
            ],
            accounts: [
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "userAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
            ],
        },
        {
            name: "depositValidate",
            docs: [
                "@notice Verify Swap's PDA items to proceed to waiting for claiming state. /!\\ initializer function",
                "@dev Function verify each item status to mutate the smart contract status to 1 (waiting for claim).  /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts signer: Pubkey => initializer",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
            ],
        },
        {
            name: "claimSol",
            docs: [
                "@notice Claims lamports from escrow. /!\\ initializer function",
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts user: Pubkey => User that will receive lamports",
                "@accounts signer: Pubkey => Initializer",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "userAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "bump",
                    type: "u8",
                },
            ],
        },
        {
            name: "claimPNft",
            docs: [
                "@notice Claim NFT from escrow. /!\\ initializer function",
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the escrow to the shared user. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts token_program: Pubkey = token_program_id",
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts user: Pubkey => User that will receive the NFT, signer: Pubkey => Initializer",
                "@accounts signer: Pubkey => Initializer",
                "@accounts item_from_deposit: Pubkey => Swap's PDA ATA related to mint",
                "@accounts item_to_deposit: Pubkey => User ATA related to mint",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "userAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEdition",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ownerTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "destinationTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "authRules",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "bump",
                    type: "u8",
                },
            ],
        },
        {
            name: "claimCNft",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "user",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "leafDelegate",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "treeAuthority",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "merkleTree",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "logWrapper",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "compressionProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "bubblegumProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "bump",
                    type: "u8",
                },
                {
                    name: "root",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "dataHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "creatorHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "nonce",
                    type: "u64",
                },
                {
                    name: "index",
                    type: "u32",
                },
            ],
        },
        {
            name: "claimValidate",
            docs: [
                "@notice Verify Swap's PDA items to proceed to closed state. /!\\ initializer function",
                "@dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => initializer",
                "@accounts signer: Pubkey => initializer",
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts token_program: Pubkey = spl_associated_token_program_id",
                "@return Void",
            ],
            accounts: [
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "initializer",
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
            ],
        },
        {
            name: "cancelSol",
            docs: [
                "@notice Cancels an item from escrow, retrieving funds if deposited previously. /!\\ initializer function",
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary if needed, change the item status to canceled and Swap's status to 90 (canceled) if not already. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts user: Pubkey => User that will receive lamports",
                "@accounts signer: Pubkey => Initializer",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "userAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "bump",
                    type: "u8",
                },
            ],
        },
        {
            name: "cancelPNft",
            docs: [
                "@notice Cancel NFT from escrow, retrieving it if previously deposited. /!\\ initializer function",
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the shared user to the escrow. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id",
                "@accounts token_program: Pubkey = token_program_id",
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts user: Pubkey => User that will potentially receive the NFT",
                "@accounts signer: Pubkey => Initializer",
                "@accounts item_from_deposit: Pubkey => Swap's PDA ATA related to mint",
                "@accounts item_to_deposit: Pubkey => User ATA related to mint",
                "@return Void",
            ],
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "user",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "userAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEdition",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ownerTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "destinationTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "authRules",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "bump",
                    type: "u8",
                },
            ],
        },
        {
            name: "cancelCNft",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "user",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "leafDelegate",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "treeAuthority",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "merkleTree",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "logWrapper",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "compressionProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "bubblegumProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
                {
                    name: "bump",
                    type: "u8",
                },
                {
                    name: "root",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "dataHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "creatorHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "nonce",
                    type: "u64",
                },
                {
                    name: "index",
                    type: "u32",
                },
            ],
        },
        {
            name: "cancelValidate",
            docs: [
                "@notice Verify Swap's PDA items to proceed to closed state. /!\\ initializer function",
                "@dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                "@accounts signer: Pubkey => initializer",
                "@accounts system_program: Pubkey = system_program_id",
                "@accounts token_program: Pubkey = spl_associated_token_program_id",
                "@return Void",
            ],
            accounts: [
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "initializer",
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "seed",
                    type: "bytes",
                },
            ],
        },
        {
            name: "adminPdaInit",
            docs: ["Maintaining AdminPda"],
            accounts: [
                {
                    name: "adminPda",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "nb",
                    type: "u32",
                },
            ],
        },
        {
            name: "adminPdaModify",
            accounts: [
                {
                    name: "adminPda",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "adminToAdd",
                    type: "publicKey",
                },
                {
                    name: "isDelete",
                    type: "bool",
                },
            ],
        },
        {
            name: "collectionPdaInit",
            docs: ["Maintaining CollectionPda"],
            accounts: [
                {
                    name: "adminPda",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "collectionPda",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "nb",
                    type: "u32",
                },
                {
                    name: "collection",
                    type: "publicKey",
                },
            ],
        },
        {
            name: "collectionPdaModify",
            accounts: [
                {
                    name: "adminPda",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "collectionPda",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "merkleKey",
                    type: "publicKey",
                },
                {
                    name: "isDelete",
                    type: "bool",
                },
            ],
        },
    ],
    accounts: [
        {
            name: "AdminPda",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "adminList",
                        type: {
                            vec: "publicKey",
                        },
                    },
                ],
            },
        },
        {
            name: "CollectionPda",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "collection",
                        type: "publicKey",
                    },
                    {
                        name: "merkleList",
                        type: {
                            vec: "publicKey",
                        },
                    },
                ],
            },
        },
        {
            name: "SwapData",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "initializer",
                        type: "publicKey",
                    },
                    {
                        name: "status",
                        type: "u8",
                    },
                    {
                        name: "nbItems",
                        type: {
                            defined: "NbItems",
                        },
                    },
                    {
                        name: "preSeed",
                        type: "string",
                    },
                    {
                        name: "seedString",
                        type: "string",
                    },
                    {
                        name: "nftItems",
                        type: {
                            vec: {
                                defined: "NftSwapItem",
                            },
                        },
                    },
                    {
                        name: "tokenItems",
                        type: {
                            vec: {
                                defined: "TokenSwapItem",
                            },
                        },
                    },
                    {
                        name: "acceptedPayement",
                        type: "publicKey",
                    },
                    {
                        name: "startTime",
                        type: "i64",
                    },
                    {
                        name: "duration",
                        type: "i64",
                    },
                ],
            },
        },
    ],
    types: [
        {
            name: "NbItems",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "nft",
                        type: "u32",
                    },
                    {
                        name: "tokens",
                        type: "u32",
                    },
                ],
            },
        },
        {
            name: "NftSwapItem",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "isCompressed",
                        type: "bool",
                    },
                    {
                        name: "mint",
                        type: "publicKey",
                    },
                    {
                        name: "merkleTree",
                        type: "publicKey",
                    },
                    {
                        name: "index",
                        type: "u32",
                    },
                    {
                        name: "amount",
                        type: "i64",
                    },
                    {
                        name: "owner",
                        type: "publicKey",
                    },
                    {
                        name: "destinary",
                        type: "publicKey",
                    },
                    {
                        name: "status",
                        type: "u8",
                    },
                    {
                        name: "collection",
                        type: "publicKey",
                    },
                ],
            },
        },
        {
            name: "TokenSwapItem",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "amount",
                        type: "i64",
                    },
                    {
                        name: "owner",
                        type: "publicKey",
                    },
                    {
                        name: "status",
                        type: "u8",
                    },
                ],
            },
        },
        {
            name: "TradeStatus",
            type: {
                kind: "enum",
                variants: [
                    {
                        name: "Initializing",
                    },
                    {
                        name: "WaitingToDeposit",
                    },
                    {
                        name: "WaitingToClaim",
                    },
                    {
                        name: "Closed",
                    },
                    {
                        name: "Canceling",
                    },
                    {
                        name: "Canceled",
                    },
                ],
            },
        },
        {
            name: "ItemStatus",
            type: {
                kind: "enum",
                variants: [
                    {
                        name: "NFTPending",
                    },
                    {
                        name: "SolPending",
                    },
                    {
                        name: "SolToClaim",
                    },
                    {
                        name: "NFTDeposited",
                    },
                    {
                        name: "SolDeposited",
                    },
                    {
                        name: "NFTClaimed",
                    },
                    {
                        name: "SolClaimed",
                    },
                    {
                        name: "NFTCanceledRecovered",
                    },
                    {
                        name: "SolCanceledRecovered",
                    },
                ],
            },
        },
    ],
    errors: [
        {
            code: 6000,
            name: "UserNotPartOfTrade",
            msg: "User not part of the trade",
        },
        {
            code: 6001,
            name: "MintIncorrect",
            msg: "Incorrect Mint",
        },
        {
            code: 6002,
            name: "AmountIncorrect",
            msg: "Amount given isn't correct",
        },
        {
            code: 6003,
            name: "ShouldntSend",
            msg: "User shouldn't be sending funds",
        },
        {
            code: 6004,
            name: "NoSend",
            msg: "Nothing was found in the smart contract to be sent to you",
        },
        {
            code: 6005,
            name: "SumNotNull",
            msg: "Sum of trade isn't null",
        },
        {
            code: 6006,
            name: "NotReady",
            msg: "Not ready for claim",
        },
        {
            code: 6007,
            name: "UnexpectedData",
            msg: "Given data isn't fitting",
        },
        {
            code: 6008,
            name: "NotSystemProgram",
            msg: "wrong system program Id passed",
        },
        {
            code: 6009,
            name: "NotTokenProgram",
            msg: "wrong token program Id passed",
        },
        {
            code: 6010,
            name: "NotPda",
            msg: "wrong Pda program Id passed",
        },
        {
            code: 6011,
            name: "NotInit",
            msg: "wrong signer, should be initializer to perform this action",
        },
        {
            code: 6012,
            name: "NotBump",
            msg: "wrong bump",
        },
        {
            code: 6013,
            name: "UnexpectedState",
            msg: "The status given is not correct",
        },
        {
            code: 6014,
            name: "InvalidAccountData",
            msg: "owner checks unsuccessfuls",
        },
        {
            code: 6015,
            name: "IncorrectLength",
            msg: "Incorrect init data length",
        },
        {
            code: 6016,
            name: "NotEnoughFunds",
            msg: "Not enough funds",
        },
        {
            code: 6017,
            name: "IncorrectOwner",
            msg: "Owner Given is incorrect",
        },
        {
            code: 6018,
            name: "NotSeed",
            msg: "Wrong seed",
        },
        {
            code: 6019,
            name: "AlreadyExist",
            msg: "Item you're trying to add already exist in the list",
        },
        {
            code: 6020,
            name: "AmountWantedEqualToAlready",
            msg: "Amount you're trying to input is equal to what's already on the PDA",
        },
        {
            code: 6021,
            name: "IncorrectAccount",
            msg: "Account passed is incorrect",
        },
        {
            code: 6022,
            name: "IncorrectStatus",
            msg: "status passed is incorrect",
        },
        {
            code: 6023,
            name: "OnlyPresign",
            msg: "This function is only to be used for presigning items",
        },
        {
            code: 6024,
            name: "OnlyNormal",
            msg: "This function is only to be used for normal items",
        },
        {
            code: 6025,
            name: "NotDelegatedToUserPda",
            msg: "The item isn't delegated to the userPda",
        },
        {
            code: 6026,
            name: "DoubleSend",
            msg: "Already found an item to send to user",
        },
        {
            code: 6027,
            name: "NotAllValidated",
            msg: "Not all user item are validated",
        },
        {
            code: 6028,
            name: "PresignCantBeReceiveSol",
            msg: "Presigning item can't be receiving sol",
        },
        {
            code: 6029,
            name: "MinSupMax",
            msg: "minimum to sell bigger than max to buy",
        },
        {
            code: 6030,
            name: "NotDelegated",
            msg: "Item not delegated to it's user PDA",
        },
        {
            code: 6031,
            name: "PdaDataNotRemoved",
            msg: "item was not found in the User PDA to be removed",
        },
        {
            code: 6032,
            name: "ItemNotFoundInUserPda",
            msg: "item was not found in the User PDA",
        },
        {
            code: 6033,
            name: "RemainingAccountNotFound",
            msg: "Missing some account passed",
        },
        {
            code: 6034,
            name: "InstructionBuilderFailed",
            msg: "Failed to build the instruction",
        },
        {
            code: 6035,
            name: "NotProgrammableNft",
            msg: "This is not a programmableNft",
        },
        {
            code: 6036,
            name: "IncorrectSplAta",
            msg: "Incorrect Token ATA Program",
        },
        {
            code: 6037,
            name: "IncorrectSysvar",
            msg: "Incorrect Sysvar Instruction Program",
        },
        {
            code: 6038,
            name: "IncorrectMetadata",
            msg: "Incorrect Metadata Program",
        },
        {
            code: 6039,
            name: "IncorrectTokenRecord",
            msg: "Incorrect token reccord account",
        },
        {
            code: 6040,
            name: "NotAuthorized",
            msg: "Not authorized to perform this action",
        },
        {
            code: 6041,
            name: "PreSeedTooLong",
            msg: "PreSeed has too many character (max: 32)",
        },
        {
            code: 6042,
            name: "SeedStringTooLong",
            msg: "SeedString has too many character (max: 32)",
        },
        {
            code: 6043,
            name: "NoAcceptedPaymentGiven",
            msg: "The list of token accepted for payment is empty",
        },
        {
            code: 6044,
            name: "NoModify",
            msg: "Nothing fund to modify",
        },
        {
            code: 6045,
            name: "AlreadyModified",
            msg: "Already found something to modify",
        },
        {
            code: 6046,
            name: "CannotFind",
            msg: "Cannot find the requested item",
        },
        {
            code: 6047,
            name: "Expired",
            msg: "Swap is expired",
        },
        {
            code: 6048,
            name: "WrongCollection",
            msg: "Collection given isn't the good one",
        },
        {
            code: 6049,
            name: "NoCollection",
            msg: "No collection found",
        },
        {
            code: 6050,
            name: "TooEarly",
            msg: "The swap isn't openned yet for depositing",
        },
        {
            code: 6051,
            name: "UnauthorizedCollection",
            msg: "The Collection you are trying to add isn't maintaind by NeoSwap, please contact Neoswap for further information",
        },
        {
            code: 6052,
            name: "UnverifiedCollection",
            msg: "Collection not verified",
        },
    ],
};
