import { Idl } from "@coral-xyz/anchor";
export const idlSwap: Idl = {
    version: "0.1.2",
    name: "collection_swap",
    docs: ["Program to manage NeoSwap's Collection swaps"],
    instructions: [
        {
            name: "makeSwap",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadataMaker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEditionMaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "ownerTokenRecordMaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "destinationTokenRecordMaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "authRulesMaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "bidToAdd",
                    type: {
                        defined: "Bid",
                    },
                },
                {
                    name: "endDate",
                    type: "i64",
                },
            ],
        },
        {
            name: "makeSwap22",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
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
                    name: "tokenProgram22",
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
                    name: "bidToAdd",
                    type: {
                        defined: "Bid",
                    },
                },
                {
                    name: "endDate",
                    type: "i64",
                },
            ],
        },
        {
            name: "takeSwap",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "taker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "takerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintTaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadataTaker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEditionTaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "ownerTokenRecordTaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "destinationTokenRecordTaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "authRulesTaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "bidToAccept",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "takeSwap22",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "taker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "takerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintTaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "hashlistMarker",
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
                    name: "tokenProgram22",
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
                    name: "bidToAccept",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "payMakerRoyalties",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "nftMetadataTaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "takerCreator0",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "takerCreator0TokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerCreator1",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "takerCreator1TokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerCreator2",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "takerCreator2TokenAta",
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "payTakerRoyalties",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "nftMetadataMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerCreator0",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerCreator0TokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerCreator1",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerCreator1TokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerCreator2",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerCreator2TokenAta",
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "payMakerRoyalties22",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintTaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "tokenProgram22",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "payTakerRoyalties22",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "tokenProgram22",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "claimSwap",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nsFee",
                    isMut: false,
                    isSigner: false,
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "nsFeeTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "taker",
                    isMut: false,
                    isSigner: false,
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "takerNftAtaMaker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "nftMetadataMaker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEditionMaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "ownerTokenRecordMaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "destinationTokenRecordMaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "authRulesMaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "claimSwap22",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nsFee",
                    isMut: true,
                    isSigner: false,
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "nsFeeTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "taker",
                    isMut: true,
                    isSigner: false,
                    docs: ["CHECK : in constraints"],
                },
                {
                    name: "takerNftAtaMaker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
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
                    name: "tokenProgram22",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "cancelSwap",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadataMaker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEditionMaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "ownerTokenRecordMaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "destinationTokenRecordMaker",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "authRulesMaker",
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "cancelSwap22",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "signer",
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMintMaker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "paymentMint",
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
                    name: "tokenProgram22",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "addBid",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "newBid",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "removeBid",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "removeBid",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "overrideTime",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "endTime",
                    type: "i64",
                },
            ],
        },
    ],
    accounts: [
        {
            name: "SwapData",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "maker",
                        type: "publicKey",
                    },
                    {
                        name: "nftMintMaker",
                        type: "publicKey",
                    },
                    {
                        name: "bids",
                        type: {
                            vec: {
                                defined: "Bid",
                            },
                        },
                    },
                    {
                        name: "taker",
                        type: {
                            option: "publicKey",
                        },
                    },
                    {
                        name: "nftMintTaker",
                        type: {
                            option: "publicKey",
                        },
                    },
                    {
                        name: "acceptedBid",
                        type: {
                            option: {
                                defined: "Bid",
                            },
                        },
                    },
                    {
                        name: "refererMaker",
                        type: {
                            option: "publicKey",
                        },
                    },
                    {
                        name: "refererTaker",
                        type: {
                            option: "publicKey",
                        },
                    },
                    {
                        name: "endTime",
                        type: "i64",
                    },
                    {
                        name: "royaltiesPaidTaker",
                        type: "bool",
                    },
                    {
                        name: "royaltiesPaidMaker",
                        type: "bool",
                    },
                    {
                        name: "paymentMint",
                        type: "publicKey",
                    },
                    {
                        name: "seed",
                        type: "string",
                    },
                ],
            },
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
                        type: "publicKey",
                    },
                    {
                        name: "amount",
                        type: "i64",
                    },
                    {
                        name: "makerNeoswapFee",
                        type: "u64",
                    },
                    {
                        name: "takerNeoswapFee",
                        type: "u64",
                    },
                    {
                        name: "takerRoyalties",
                        type: "u64",
                    },
                    {
                        name: "makerRoyalties",
                        type: "u64",
                    },
                ],
            },
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
            name: "MintIncorrect",
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
            msg: "Fees are not paid, please pay the fees before claiming the swap",
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
    ],
};
