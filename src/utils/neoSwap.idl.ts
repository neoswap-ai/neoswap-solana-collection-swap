export const idlSwap: CollectionSwap = {
    address: "NSWPpfskKcHo93mxZSgdinqpnFkcdWPsSxBB9Q26Qbq",
    metadata: {
        name: "collection_swap",
        version: "0.4.0",
        spec: "0.1.0",
        description: "collection_swap",
    },
    docs: ["Program to manage NeoSwap's Collection swaps"],
    instructions: [
        {
            name: "add_bid",
            discriminator: [175, 182, 241, 211, 34, 34, 119, 234],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                    optional: true,
                },
                {
                    name: "token_program",
                },
            ],
            args: [
                {
                    name: "new_bid",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
            ],
        },
        {
            name: "cancel_swap",
            discriminator: [88, 174, 98, 148, 24, 252, 93, 89],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_nft_ata",
                    writable: true,
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "maker_nft_ata",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "nft_metadata_maker",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [109, 101, 116, 97, 100, 97, 116, 97],
                            },
                            {
                                kind: "account",
                                path: "metadata_program",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_maker",
                            },
                        ],
                        program: {
                            kind: "account",
                            path: "metadata_program",
                        },
                    },
                },
                {
                    name: "nft_master_edition_maker",
                    optional: true,
                },
                {
                    name: "owner_token_record_maker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "destination_token_record_maker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "auth_rules_maker",
                    optional: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "metadata_program",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "ata_program",
                },
                {
                    name: "auth_rules_program",
                },
            ],
            args: [],
        },
        {
            name: "cancel_swap22",
            discriminator: [208, 205, 79, 181, 249, 202, 156, 126],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_nft_ata",
                    writable: true,
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "maker_nft_ata",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "token_program",
                },
                {
                    name: "token_program22",
                },
                {
                    name: "ata_program",
                },
            ],
            args: [],
        },
        {
            name: "cancel_swap_core",
            discriminator: [187, 175, 250, 223, 120, 39, 22, 136],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                    writable: true,
                },
                {
                    name: "collection",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "token_program",
                },
                {
                    name: "core_program",
                },
            ],
            args: [],
        },
        {
            name: "claim_swap",
            discriminator: [57, 101, 146, 206, 102, 117, 112, 113],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_nft_ata",
                    writable: true,
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "ns_fee",
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "ns_fee_token_ata",
                    writable: true,
                },
                {
                    name: "taker",
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "taker_nft_ata_maker",
                    writable: true,
                },
                {
                    name: "taker_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "nft_metadata_maker",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [109, 101, 116, 97, 100, 97, 116, 97],
                            },
                            {
                                kind: "account",
                                path: "metadata_program",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_maker",
                            },
                        ],
                        program: {
                            kind: "account",
                            path: "metadata_program",
                        },
                    },
                },
                {
                    name: "nft_master_edition_maker",
                    optional: true,
                },
                {
                    name: "owner_token_record_maker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "destination_token_record_maker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "auth_rules_maker",
                    optional: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "metadata_program",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "ata_program",
                },
                {
                    name: "auth_rules_program",
                },
            ],
            args: [],
        },
        {
            name: "claim_swap22",
            discriminator: [2, 71, 161, 68, 27, 160, 38, 199],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_nft_ata",
                    writable: true,
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "ns_fee",
                    docs: ["CHECK : in constraints"],
                    writable: true,
                },
                {
                    name: "ns_fee_token_ata",
                    writable: true,
                },
                {
                    name: "taker",
                    docs: ["CHECK : in constraints"],
                    writable: true,
                },
                {
                    name: "taker_nft_ata_maker",
                    writable: true,
                },
                {
                    name: "taker_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "token_program22",
                },
                {
                    name: "ata_program",
                },
            ],
            args: [],
        },
        {
            name: "claim_swap_core",
            discriminator: [16, 165, 132, 93, 23, 254, 166, 9],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "ns_fee",
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "ns_fee_token_ata",
                    writable: true,
                },
                {
                    name: "taker",
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "taker_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                    writable: true,
                },
                {
                    name: "collection",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "token_program",
                },
                {
                    name: "ata_program",
                },
                {
                    name: "core_program",
                },
            ],
            args: [],
        },
        {
            name: "close_swap",
            discriminator: [244, 111, 137, 155, 121, 104, 126, 143],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "token_program",
                },
            ],
            args: [],
        },
        {
            name: "make_swap",
            discriminator: [53, 60, 229, 243, 157, 94, 98, 186],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "maker",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_maker",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_nft_ata",
                    writable: true,
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "maker_nft_ata",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "nft_metadata_maker",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [109, 101, 116, 97, 100, 97, 116, 97],
                            },
                            {
                                kind: "account",
                                path: "metadata_program",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_maker",
                            },
                        ],
                        program: {
                            kind: "account",
                            path: "metadata_program",
                        },
                    },
                },
                {
                    name: "nft_master_edition_maker",
                    optional: true,
                },
                {
                    name: "owner_token_record_maker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "destination_token_record_maker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "auth_rules_maker",
                    optional: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "metadata_program",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "ata_program",
                },
                {
                    name: "auth_rules_program",
                },
            ],
            args: [
                {
                    name: "bid_to_add",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
                {
                    name: "end_date",
                    type: "i64",
                },
            ],
        },
        {
            name: "make_swap22",
            discriminator: [164, 236, 205, 52, 222, 177, 64, 178],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "maker",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_maker",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_nft_ata",
                    writable: true,
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "maker_nft_ata",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "token_program22",
                },
                {
                    name: "ata_program",
                },
            ],
            args: [
                {
                    name: "bid_to_add",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
                {
                    name: "end_date",
                    type: "i64",
                },
            ],
        },
        {
            name: "make_swap_core",
            discriminator: [44, 178, 176, 37, 166, 110, 163, 109],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "maker",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_maker",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_maker",
                    writable: true,
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "collection",
                },
                {
                    name: "core_program",
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "token_program",
                },
            ],
            args: [
                {
                    name: "bid_to_add",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
                {
                    name: "end_date",
                    type: "i64",
                },
            ],
        },
        {
            name: "override_time",
            discriminator: [50, 176, 30, 138, 244, 107, 76, 2],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "maker",
                    writable: true,
                    signer: true,
                },
            ],
            args: [
                {
                    name: "end_time",
                    type: "i64",
                },
            ],
        },
        {
            name: "pay_royalties",
            discriminator: [49, 83, 229, 90, 55, 151, 131, 24],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "nft_metadata",
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [109, 101, 116, 97, 100, 97, 116, 97],
                            },
                            {
                                kind: "account",
                                path: "metadata_program",
                            },
                            {
                                kind: "account",
                                path: "nft_mint",
                            },
                        ],
                        program: {
                            kind: "account",
                            path: "metadata_program",
                        },
                    },
                },
                {
                    name: "nft_mint",
                },
                {
                    name: "metadata_program",
                },
                {
                    name: "token_program",
                },
                {
                    name: "creator0",
                },
                {
                    name: "creator0_token_ata",
                    writable: true,
                },
                {
                    name: "creator1",
                },
                {
                    name: "creator1_token_ata",
                    writable: true,
                },
                {
                    name: "creator2",
                },
                {
                    name: "creator2_token_ata",
                    writable: true,
                },
                {
                    name: "creator3",
                },
                {
                    name: "creator3_token_ata",
                    writable: true,
                },
                {
                    name: "creator4",
                },
                {
                    name: "creator4_token_ata",
                    writable: true,
                },
            ],
            args: [],
        },
        {
            name: "pay_royalties22",
            discriminator: [45, 146, 35, 158, 92, 10, 74, 82],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "nft_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "token_program22",
                },
            ],
            args: [],
        },
        {
            name: "pay_royalties_core",
            discriminator: [160, 136, 87, 195, 165, 47, 227, 132],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "signer",
                    signer: true,
                },
                {
                    name: "nft_mint",
                },
                {
                    name: "token_program",
                },
                {
                    name: "maker_creator0",
                },
                {
                    name: "maker_creator0_token_ata",
                    writable: true,
                },
                {
                    name: "maker_creator1",
                },
                {
                    name: "maker_creator1_token_ata",
                    writable: true,
                },
                {
                    name: "maker_creator2",
                },
                {
                    name: "maker_creator2_token_ata",
                    writable: true,
                },
                {
                    name: "maker_creator3",
                },
                {
                    name: "maker_creator3_token_ata",
                    writable: true,
                },
                {
                    name: "maker_creator4",
                },
                {
                    name: "maker_creator4_token_ata",
                    writable: true,
                },
            ],
            args: [],
        },
        {
            name: "remove_bid",
            discriminator: [67, 240, 240, 181, 3, 42, 61, 57],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "maker",
                    writable: true,
                    signer: true,
                },
            ],
            args: [
                {
                    name: "remove_bid",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
            ],
        },
        {
            name: "take_swap",
            discriminator: [82, 194, 146, 185, 78, 77, 212, 139],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                },
                {
                    name: "maker_nft_ata",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "taker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "taker_nft_ata",
                    writable: true,
                },
                {
                    name: "taker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_taker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "nft_metadata_taker",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [109, 101, 116, 97, 100, 97, 116, 97],
                            },
                            {
                                kind: "account",
                                path: "metadata_program",
                            },
                            {
                                kind: "account",
                                path: "nft_mint_taker",
                            },
                        ],
                        program: {
                            kind: "account",
                            path: "metadata_program",
                        },
                    },
                },
                {
                    name: "nft_master_edition_taker",
                    optional: true,
                },
                {
                    name: "owner_token_record_taker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "destination_token_record_taker",
                    writable: true,
                    optional: true,
                },
                {
                    name: "auth_rules_taker",
                    optional: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "metadata_program",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "ata_program",
                },
                {
                    name: "auth_rules_program",
                },
            ],
            args: [
                {
                    name: "bid_to_accept",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
            ],
        },
        {
            name: "take_swap22",
            discriminator: [73, 19, 84, 21, 81, 158, 142, 69],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                },
                {
                    name: "maker_nft_ata",
                    writable: true,
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "taker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "taker_nft_ata",
                    writable: true,
                },
                {
                    name: "taker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_taker",
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "hashlist_marker",
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
                {
                    name: "token_program",
                },
                {
                    name: "token_program22",
                },
                {
                    name: "ata_program",
                },
            ],
            args: [
                {
                    name: "bid_to_accept",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
            ],
        },
        {
            name: "take_swap_core",
            discriminator: [199, 209, 161, 30, 107, 131, 134, 234],
            accounts: [
                {
                    name: "swap_data_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [115, 119, 97, 112],
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.maker",
                                account: "SwapData",
                            },
                            {
                                kind: "account",
                                path: "swap_data_account.nft_mint_maker",
                                account: "SwapData",
                            },
                        ],
                    },
                },
                {
                    name: "swap_data_account_token_ata",
                    writable: true,
                },
                {
                    name: "maker",
                },
                {
                    name: "maker_token_ata",
                    writable: true,
                },
                {
                    name: "taker",
                    writable: true,
                    signer: true,
                },
                {
                    name: "taker_token_ata",
                    writable: true,
                },
                {
                    name: "nft_mint_taker",
                    writable: true,
                },
                {
                    name: "payment_mint",
                },
                {
                    name: "collection",
                },
                {
                    name: "sysvar_instructions",
                },
                {
                    name: "token_program",
                },
                {
                    name: "core_program",
                },
            ],
            args: [
                {
                    name: "bid_to_accept",
                    type: {
                        defined: {
                            name: "Bid",
                        },
                    },
                },
            ],
        },
    ],
    accounts: [
        {
            name: "SwapData",
            discriminator: [107, 253, 23, 129, 228, 108, 158, 32],
        },
    ],
    errors: [
        {
            code: 6000,
            name: "EmptyBids",
            msg: "List of Bids is empty",
        },
        {
            code: 6001,
            name: "BidAlreadyExists",
            msg: "Bid already exists",
        },
        {
            code: 6002,
            name: "IncorrectMint",
            msg: "Incorrect Mint",
        },
        {
            code: 6003,
            name: "SeedLengthIncorrect",
            msg: "Given seed length is Incorrect",
        },
        {
            code: 6004,
            name: "UnexpectedState",
            msg: "The status given is not correct",
        },
        {
            code: 6005,
            name: "IncorrectFeeAccount",
            msg: "Fee Account is not correct",
        },
        {
            code: 6006,
            name: "IncorrectDate",
            msg: "Date given is incorrect",
        },
        {
            code: 6007,
            name: "IncorrectAmount",
            msg: "Amount given is incorrect",
        },
        {
            code: 6008,
            name: "IncorrectPayment",
            msg: "Incorrect Payment Mint",
        },
        {
            code: 6009,
            name: "NoAcceptedBidFound",
            msg: "You need to take swap before claimimg it",
        },
        {
            code: 6010,
            name: "NotClaimed",
            msg: "You need to claim swap before closing it",
        },
        {
            code: 6100,
            name: "NotMaker",
            msg: "wrong signer, only maker can perform this action",
        },
        {
            code: 6101,
            name: "NotTaker",
            msg: "wrong address for Taker",
        },
        {
            code: 6102,
            name: "IncorrectOwner",
            msg: "Owner Given is incorrect",
        },
        {
            code: 6200,
            name: "UnVerifiedCollection",
            msg: "Collection is unverified",
        },
        {
            code: 6201,
            name: "IncorrectCollection",
            msg: "Collection doesnt't match givent mint collection",
        },
        {
            code: 6202,
            name: "UnVerifiedCreator",
            msg: "Creator is unverified",
        },
        {
            code: 6203,
            name: "IncorrectCreator",
            msg: "Creator passed is incorrect",
        },
        {
            code: 6204,
            name: "NotCoreAsset",
            msg: "Asset is not a Mpl Core asset",
        },
        {
            code: 6300,
            name: "AlreadyExist",
            msg: "The item you're trying to add already exists in the SDA",
        },
        {
            code: 6301,
            name: "CannotFindAccount",
            msg: "Cannot find the account",
        },
        {
            code: 6302,
            name: "IncorrectState",
            msg: "Swap is not in the adequate state to perform this action",
        },
        {
            code: 6303,
            name: "CollectionNotFound",
            msg: "Cannot find the given collection in the SDA",
        },
        {
            code: 6304,
            name: "AlreadyTaken",
            msg: "Swap already accepted",
        },
        {
            code: 6305,
            name: "BidNotFound",
            msg: "Bid not found in the list of bids",
        },
        {
            code: 6306,
            name: "FeeNotPaid",
            msg: "Fees are not paid, please pay the fees before closing the swap",
        },
        {
            code: 6307,
            name: "RoyaltiesAlreadyPaid",
            msg: "Royalties already paied",
        },
        {
            code: 6308,
            name: "TooLate",
            msg: "the Swap you tried to accept is expired",
        },
        {
            code: 6309,
            name: "TooEarly",
            msg: "Too early to perform this action",
        },
        {
            code: 6900,
            name: "IncorrectSysvar",
            msg: "Incorrect Sysvar Instruction Program",
        },
        {
            code: 6901,
            name: "IncorrectMetadata",
            msg: "Incorrect Metadata Program",
        },
        {
            code: 6902,
            name: "IncorrectSplAta",
            msg: "Incorrect Token ATA Program",
        },
        {
            code: 6903,
            name: "IncorrectTokenProgram",
            msg: "Incorrect Token Program",
        },
        {
            code: 6904,
            name: "IncorrectCoreProgram",
            msg: "Incorrect Core Program",
        },
    ],
    types: [
        {
            name: "Bid",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "collection",
                        type: "pubkey",
                    },
                    {
                        name: "amount",
                        type: "i64",
                    },
                    {
                        name: "maker_neoswap_fee",
                        type: "u64",
                    },
                    {
                        name: "taker_neoswap_fee",
                        type: "u64",
                    },
                    {
                        name: "taker_royalties",
                        type: "u64",
                    },
                    {
                        name: "maker_royalties",
                        type: "u64",
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
                        name: "maker",
                        type: "pubkey",
                    },
                    {
                        name: "nft_mint_maker",
                        type: "pubkey",
                    },
                    {
                        name: "bids",
                        type: {
                            vec: {
                                defined: {
                                    name: "Bid",
                                },
                            },
                        },
                    },
                    {
                        name: "taker",
                        type: {
                            option: "pubkey",
                        },
                    },
                    {
                        name: "nft_mint_taker",
                        type: {
                            option: "pubkey",
                        },
                    },
                    {
                        name: "accepted_bid",
                        type: {
                            option: {
                                defined: {
                                    name: "Bid",
                                },
                            },
                        },
                    },
                    {
                        name: "referer_maker",
                        type: {
                            option: "pubkey",
                        },
                    },
                    {
                        name: "referer_taker",
                        type: {
                            option: "pubkey",
                        },
                    },
                    {
                        name: "end_time",
                        type: "i64",
                    },
                    {
                        name: "royalties_paid_taker",
                        type: "bool",
                    },
                    {
                        name: "royalties_paid_maker",
                        type: "bool",
                    },
                    {
                        name: "claimed",
                        type: "bool",
                    },
                    {
                        name: "payment_mint",
                        type: "pubkey",
                    },
                ],
            },
        },
    ],
} as any as CollectionSwap;

export type CollectionSwap = {
    address: string;
    metadata: {
        name: "collectionSwap";
        version: "0.4.0";
        spec: "0.1.0";
        description: "collectionSwap";
    };
    docs: ["Program to manage NeoSwap's Collection swaps"];
    instructions: [
        {
            name: "addBid";
            discriminator: [175, 182, 241, 211, 34, 34, 119, 234];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                    optional: true;
                },
                {
                    name: "tokenProgram";
                }
            ];
            args: [
                {
                    name: "newBid";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                }
            ];
        },
        {
            name: "cancelSwap";
            discriminator: [88, 174, 98, 148, 24, 252, 93, 89];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountNftAta";
                    writable: true;
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "makerNftAta";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "nftMetadataMaker";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [109, 101, 116, 97, 100, 97, 116, 97];
                            },
                            {
                                kind: "account";
                                path: "metadataProgram";
                            },
                            {
                                kind: "account";
                                path: "nftMintMaker";
                            }
                        ];
                        program: {
                            kind: "account";
                            path: "metadataProgram";
                        };
                    };
                },
                {
                    name: "nftMasterEditionMaker";
                    optional: true;
                },
                {
                    name: "ownerTokenRecordMaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "destinationTokenRecordMaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "authRulesMaker";
                    optional: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "metadataProgram";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "ataProgram";
                },
                {
                    name: "authRulesProgram";
                }
            ];
            args: [];
        },
        {
            name: "cancelSwap22";
            discriminator: [208, 205, 79, 181, 249, 202, 156, 126];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountNftAta";
                    writable: true;
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "makerNftAta";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "tokenProgram22";
                },
                {
                    name: "ataProgram";
                }
            ];
            args: [];
        },
        {
            name: "cancelSwapCore";
            discriminator: [187, 175, 250, 223, 120, 39, 22, 136];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                    writable: true;
                },
                {
                    name: "collection";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "coreProgram";
                }
            ];
            args: [];
        },
        {
            name: "claimSwap";
            discriminator: [57, 101, 146, 206, 102, 117, 112, 113];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountNftAta";
                    writable: true;
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "nsFee";
                    docs: ["CHECK : in constraints"];
                },
                {
                    name: "nsFeeTokenAta";
                    writable: true;
                },
                {
                    name: "taker";
                    docs: ["CHECK : in constraints"];
                },
                {
                    name: "takerNftAtaMaker";
                    writable: true;
                },
                {
                    name: "takerTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "nftMetadataMaker";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [109, 101, 116, 97, 100, 97, 116, 97];
                            },
                            {
                                kind: "account";
                                path: "metadataProgram";
                            },
                            {
                                kind: "account";
                                path: "nftMintMaker";
                            }
                        ];
                        program: {
                            kind: "account";
                            path: "metadataProgram";
                        };
                    };
                },
                {
                    name: "nftMasterEditionMaker";
                    optional: true;
                },
                {
                    name: "ownerTokenRecordMaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "destinationTokenRecordMaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "authRulesMaker";
                    optional: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "metadataProgram";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "ataProgram";
                },
                {
                    name: "authRulesProgram";
                }
            ];
            args: [];
        },
        {
            name: "claimSwap22";
            discriminator: [2, 71, 161, 68, 27, 160, 38, 199];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountNftAta";
                    writable: true;
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "nsFee";
                    docs: ["CHECK : in constraints"];
                    writable: true;
                },
                {
                    name: "nsFeeTokenAta";
                    writable: true;
                },
                {
                    name: "taker";
                    docs: ["CHECK : in constraints"];
                    writable: true;
                },
                {
                    name: "takerNftAtaMaker";
                    writable: true;
                },
                {
                    name: "takerTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "tokenProgram22";
                },
                {
                    name: "ataProgram";
                }
            ];
            args: [];
        },
        {
            name: "claimSwapCore";
            discriminator: [16, 165, 132, 93, 23, 254, 166, 9];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "nsFee";
                    docs: ["CHECK : in constraints"];
                },
                {
                    name: "nsFeeTokenAta";
                    writable: true;
                },
                {
                    name: "taker";
                    docs: ["CHECK : in constraints"];
                },
                {
                    name: "takerTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                    writable: true;
                },
                {
                    name: "collection";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "ataProgram";
                },
                {
                    name: "coreProgram";
                }
            ];
            args: [];
        },
        {
            name: "closeSwap";
            discriminator: [244, 111, 137, 155, 121, 104, 126, 143];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "tokenProgram";
                }
            ];
            args: [];
        },
        {
            name: "makeSwap";
            discriminator: [53, 60, 229, 243, 157, 94, 98, 186];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "maker";
                            },
                            {
                                kind: "account";
                                path: "nftMintMaker";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountNftAta";
                    writable: true;
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "makerNftAta";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "nftMetadataMaker";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [109, 101, 116, 97, 100, 97, 116, 97];
                            },
                            {
                                kind: "account";
                                path: "metadataProgram";
                            },
                            {
                                kind: "account";
                                path: "nftMintMaker";
                            }
                        ];
                        program: {
                            kind: "account";
                            path: "metadataProgram";
                        };
                    };
                },
                {
                    name: "nftMasterEditionMaker";
                    optional: true;
                },
                {
                    name: "ownerTokenRecordMaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "destinationTokenRecordMaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "authRulesMaker";
                    optional: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "metadataProgram";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "ataProgram";
                },
                {
                    name: "authRulesProgram";
                }
            ];
            args: [
                {
                    name: "bidToAdd";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                },
                {
                    name: "endDate";
                    type: "i64";
                }
            ];
        },
        {
            name: "makeSwap22";
            discriminator: [164, 236, 205, 52, 222, 177, 64, 178];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "maker";
                            },
                            {
                                kind: "account";
                                path: "nftMintMaker";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountNftAta";
                    writable: true;
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "makerNftAta";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "tokenProgram22";
                },
                {
                    name: "ataProgram";
                }
            ];
            args: [
                {
                    name: "bidToAdd";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                },
                {
                    name: "endDate";
                    type: "i64";
                }
            ];
        },
        {
            name: "makeSwapCore";
            discriminator: [44, 178, 176, 37, 166, 110, 163, 109];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "maker";
                            },
                            {
                                kind: "account";
                                path: "nftMintMaker";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintMaker";
                    writable: true;
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "collection";
                },
                {
                    name: "coreProgram";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "tokenProgram";
                }
            ];
            args: [
                {
                    name: "bidToAdd";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                },
                {
                    name: "endDate";
                    type: "i64";
                }
            ];
        },
        {
            name: "overrideTime";
            discriminator: [50, 176, 30, 138, 244, 107, 76, 2];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "maker";
                    writable: true;
                    signer: true;
                }
            ];
            args: [
                {
                    name: "endTime";
                    type: "i64";
                }
            ];
        },
        {
            name: "payRoyalties";
            discriminator: [49, 83, 229, 90, 55, 151, 131, 24];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "nftMetadata";
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [109, 101, 116, 97, 100, 97, 116, 97];
                            },
                            {
                                kind: "account";
                                path: "metadataProgram";
                            },
                            {
                                kind: "account";
                                path: "nftMint";
                            }
                        ];
                        program: {
                            kind: "account";
                            path: "metadataProgram";
                        };
                    };
                },
                {
                    name: "nftMint";
                },
                {
                    name: "metadataProgram";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "creator0";
                },
                {
                    name: "creator0TokenAta";
                    writable: true;
                },
                {
                    name: "creator1";
                },
                {
                    name: "creator1TokenAta";
                    writable: true;
                },
                {
                    name: "creator2";
                },
                {
                    name: "creator2TokenAta";
                    writable: true;
                },
                {
                    name: "creator3";
                },
                {
                    name: "creator3TokenAta";
                    writable: true;
                },
                {
                    name: "creator4";
                },
                {
                    name: "creator4TokenAta";
                    writable: true;
                }
            ];
            args: [];
        },
        {
            name: "payRoyalties22";
            discriminator: [45, 146, 35, 158, 92, 10, 74, 82];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "nftMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "tokenProgram22";
                }
            ];
            args: [];
        },
        {
            name: "payRoyaltiesCore";
            discriminator: [160, 136, 87, 195, 165, 47, 227, 132];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "signer";
                    signer: true;
                },
                {
                    name: "nftMint";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "makerCreator0";
                },
                {
                    name: "makerCreator0TokenAta";
                    writable: true;
                },
                {
                    name: "makerCreator1";
                },
                {
                    name: "makerCreator1TokenAta";
                    writable: true;
                },
                {
                    name: "makerCreator2";
                },
                {
                    name: "makerCreator2TokenAta";
                    writable: true;
                },
                {
                    name: "makerCreator3";
                },
                {
                    name: "makerCreator3TokenAta";
                    writable: true;
                },
                {
                    name: "makerCreator4";
                },
                {
                    name: "makerCreator4TokenAta";
                    writable: true;
                }
            ];
            args: [];
        },
        {
            name: "removeBid";
            discriminator: [67, 240, 240, 181, 3, 42, 61, 57];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "maker";
                    writable: true;
                    signer: true;
                }
            ];
            args: [
                {
                    name: "removeBid";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                }
            ];
        },
        {
            name: "takeSwap";
            discriminator: [82, 194, 146, 185, 78, 77, 212, 139];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                },
                {
                    name: "makerNftAta";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "taker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "takerNftAta";
                    writable: true;
                },
                {
                    name: "takerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintTaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "nftMetadataTaker";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [109, 101, 116, 97, 100, 97, 116, 97];
                            },
                            {
                                kind: "account";
                                path: "metadataProgram";
                            },
                            {
                                kind: "account";
                                path: "nftMintTaker";
                            }
                        ];
                        program: {
                            kind: "account";
                            path: "metadataProgram";
                        };
                    };
                },
                {
                    name: "nftMasterEditionTaker";
                    optional: true;
                },
                {
                    name: "ownerTokenRecordTaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "destinationTokenRecordTaker";
                    writable: true;
                    optional: true;
                },
                {
                    name: "authRulesTaker";
                    optional: true;
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "metadataProgram";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "ataProgram";
                },
                {
                    name: "authRulesProgram";
                }
            ];
            args: [
                {
                    name: "bidToAccept";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                }
            ];
        },
        {
            name: "takeSwap22";
            discriminator: [73, 19, 84, 21, 81, 158, 142, 69];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                },
                {
                    name: "makerNftAta";
                    writable: true;
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "taker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "takerNftAta";
                    writable: true;
                },
                {
                    name: "takerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintTaker";
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "hashlistMarker";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "tokenProgram22";
                },
                {
                    name: "ataProgram";
                }
            ];
            args: [
                {
                    name: "bidToAccept";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                }
            ];
        },
        {
            name: "takeSwapCore";
            discriminator: [199, 209, 161, 30, 107, 131, 134, 234];
            accounts: [
                {
                    name: "swapDataAccount";
                    writable: true;
                    pda: {
                        seeds: [
                            {
                                kind: "const";
                                value: [115, 119, 97, 112];
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.maker";
                                account: "swapData";
                            },
                            {
                                kind: "account";
                                path: "swap_data_account.nft_mint_maker";
                                account: "swapData";
                            }
                        ];
                    };
                },
                {
                    name: "swapDataAccountTokenAta";
                    writable: true;
                },
                {
                    name: "maker";
                },
                {
                    name: "makerTokenAta";
                    writable: true;
                },
                {
                    name: "taker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "takerTokenAta";
                    writable: true;
                },
                {
                    name: "nftMintTaker";
                    writable: true;
                },
                {
                    name: "paymentMint";
                },
                {
                    name: "collection";
                },
                {
                    name: "sysvarInstructions";
                },
                {
                    name: "tokenProgram";
                },
                {
                    name: "coreProgram";
                }
            ];
            args: [
                {
                    name: "bidToAccept";
                    type: {
                        defined: {
                            name: "bid";
                        };
                    };
                }
            ];
        }
    ];
    accounts: [
        {
            name: "swapData";
            discriminator: [107, 253, 23, 129, 228, 108, 158, 32];
        }
    ];
    errors: [
        {
            code: 6000;
            name: "emptyBids";
            msg: "List of Bids is empty";
        },
        {
            code: 6001;
            name: "bidAlreadyExists";
            msg: "Bid already exists";
        },
        {
            code: 6002;
            name: "incorrectMint";
            msg: "Incorrect Mint";
        },
        {
            code: 6003;
            name: "seedLengthIncorrect";
            msg: "Given seed length is Incorrect";
        },
        {
            code: 6004;
            name: "unexpectedState";
            msg: "The status given is not correct";
        },
        {
            code: 6005;
            name: "incorrectFeeAccount";
            msg: "Fee Account is not correct";
        },
        {
            code: 6006;
            name: "incorrectDate";
            msg: "Date given is incorrect";
        },
        {
            code: 6007;
            name: "incorrectAmount";
            msg: "Amount given is incorrect";
        },
        {
            code: 6008;
            name: "incorrectPayment";
            msg: "Incorrect Payment Mint";
        },
        {
            code: 6009;
            name: "noAcceptedBidFound";
            msg: "You need to take swap before claimimg it";
        },
        {
            code: 6010;
            name: "notClaimed";
            msg: "You need to claim swap before closing it";
        },
        {
            code: 6100;
            name: "notMaker";
            msg: "wrong signer, only maker can perform this action";
        },
        {
            code: 6101;
            name: "notTaker";
            msg: "wrong address for Taker";
        },
        {
            code: 6102;
            name: "incorrectOwner";
            msg: "Owner Given is incorrect";
        },
        {
            code: 6200;
            name: "unVerifiedCollection";
            msg: "Collection is unverified";
        },
        {
            code: 6201;
            name: "incorrectCollection";
            msg: "Collection doesnt't match givent mint collection";
        },
        {
            code: 6202;
            name: "unVerifiedCreator";
            msg: "Creator is unverified";
        },
        {
            code: 6203;
            name: "incorrectCreator";
            msg: "Creator passed is incorrect";
        },
        {
            code: 6204;
            name: "notCoreAsset";
            msg: "Asset is not a Mpl Core asset";
        },
        {
            code: 6300;
            name: "alreadyExist";
            msg: "The item you're trying to add already exists in the SDA";
        },
        {
            code: 6301;
            name: "cannotFindAccount";
            msg: "Cannot find the account";
        },
        {
            code: 6302;
            name: "incorrectState";
            msg: "Swap is not in the adequate state to perform this action";
        },
        {
            code: 6303;
            name: "collectionNotFound";
            msg: "Cannot find the given collection in the SDA";
        },
        {
            code: 6304;
            name: "alreadyTaken";
            msg: "Swap already accepted";
        },
        {
            code: 6305;
            name: "bidNotFound";
            msg: "Bid not found in the list of bids";
        },
        {
            code: 6306;
            name: "feeNotPaid";
            msg: "Fees are not paid, please pay the fees before closing the swap";
        },
        {
            code: 6307;
            name: "royaltiesAlreadyPaid";
            msg: "Royalties already paied";
        },
        {
            code: 6308;
            name: "tooLate";
            msg: "the Swap you tried to accept is expired";
        },
        {
            code: 6309;
            name: "tooEarly";
            msg: "Too early to perform this action";
        },
        {
            code: 6900;
            name: "incorrectSysvar";
            msg: "Incorrect Sysvar Instruction Program";
        },
        {
            code: 6901;
            name: "incorrectMetadata";
            msg: "Incorrect Metadata Program";
        },
        {
            code: 6902;
            name: "incorrectSplAta";
            msg: "Incorrect Token ATA Program";
        },
        {
            code: 6903;
            name: "incorrectTokenProgram";
            msg: "Incorrect Token Program";
        },
        {
            code: 6904;
            name: "incorrectCoreProgram";
            msg: "Incorrect Core Program";
        }
    ];
    types: [
        {
            name: "bid";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "collection";
                        type: "pubkey";
                    },
                    {
                        name: "amount";
                        type: "i64";
                    },
                    {
                        name: "makerNeoswapFee";
                        type: "u64";
                    },
                    {
                        name: "takerNeoswapFee";
                        type: "u64";
                    },
                    {
                        name: "takerRoyalties";
                        type: "u64";
                    },
                    {
                        name: "makerRoyalties";
                        type: "u64";
                    }
                ];
            };
        },
        {
            name: "swapData";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "maker";
                        type: "pubkey";
                    },
                    {
                        name: "nftMintMaker";
                        type: "pubkey";
                    },
                    {
                        name: "bids";
                        type: {
                            vec: {
                                defined: {
                                    name: "bid";
                                };
                            };
                        };
                    },
                    {
                        name: "taker";
                        type: {
                            option: "pubkey";
                        };
                    },
                    {
                        name: "nftMintTaker";
                        type: {
                            option: "pubkey";
                        };
                    },
                    {
                        name: "acceptedBid";
                        type: {
                            option: {
                                defined: {
                                    name: "bid";
                                };
                            };
                        };
                    },
                    {
                        name: "refererMaker";
                        type: {
                            option: "pubkey";
                        };
                    },
                    {
                        name: "refererTaker";
                        type: {
                            option: "pubkey";
                        };
                    },
                    {
                        name: "endTime";
                        type: "i64";
                    },
                    {
                        name: "royaltiesPaidTaker";
                        type: "bool";
                    },
                    {
                        name: "royaltiesPaidMaker";
                        type: "bool";
                    },
                    {
                        name: "claimed";
                        type: "bool";
                    },
                    {
                        name: "paymentMint";
                        type: "pubkey";
                    }
                ];
            };
        }
    ];
};
