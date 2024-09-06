export const idlSwap: CollectionSwap = {
  address: "2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7",
  metadata: {
    name: "collectionSwap",
    version: "0.5.0",
    spec: "0.1.0",
    description: "collectionSwap",
  },
  docs: ["Program to manage NeoSwap's Collection swaps"],
  instructions: [
    {
      name: "addBid",
      discriminator: [175, 182, 241, 211, 34, 34, 119, 234],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
          signer: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
          optional: true,
        },
        {
          name: "tokenProgram",
        },
      ],
      args: [
        {
          name: "newBid",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
      ],
    },
    {
      name: "cancelSwap",
      discriminator: [88, 174, 98, 148, 24, 252, 93, 89],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountNftAta",
          writable: true,
        },
        {
          name: "swapDataAccountTokenAta",
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
          name: "makerNftAta",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
        },
        {
          name: "nftMetadataMaker",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "account",
                path: "metadataProgram",
              },
              {
                kind: "account",
                path: "nftMintMaker",
              },
            ],
            program: {
              kind: "account",
              path: "metadataProgram",
            },
          },
        },
        {
          name: "nftMasterEditionMaker",
          optional: true,
        },
        {
          name: "ownerTokenRecordMaker",
          writable: true,
          optional: true,
        },
        {
          name: "destinationTokenRecordMaker",
          writable: true,
          optional: true,
        },
        {
          name: "authRulesMaker",
          optional: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "metadataProgram",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "authRulesProgram",
        },
      ],
      args: [],
    },
    {
      name: "cancelSwap22",
      discriminator: [208, 205, 79, 181, 249, 202, 156, 126],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountNftAta",
          writable: true,
        },
        {
          name: "swapDataAccountTokenAta",
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
          name: "makerNftAta",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "tokenProgram22",
        },
        {
          name: "ataProgram",
        },
      ],
      args: [],
    },
    {
      name: "cancelSwapComp",
      discriminator: [178, 93, 63, 195, 14, 39, 40, 171],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
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
          name: "treeAuthority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "merkleTree",
              },
            ],
            program: {
              kind: "account",
              path: "bubblegumProgram",
            },
          },
        },
        {
          name: "merkleTree",
          writable: true,
        },
        {
          name: "logWrapper",
        },
        {
          name: "compressionProgram",
        },
        {
          name: "bubblegumProgram",
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
      ],
      args: [
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
      name: "cancelSwapCore",
      discriminator: [187, 175, 250, 223, 120, 39, 22, 136],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
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
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
          writable: true,
        },
        {
          name: "collection",
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "coreProgram",
        },
      ],
      args: [],
    },
    {
      name: "claimSwap",
      discriminator: [57, 101, 146, 206, 102, 117, 112, 113],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountNftAta",
          writable: true,
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "nsFee",
          docs: ["CHECK : in constraints"],
        },
        {
          name: "nsFeeTokenAta",
          writable: true,
        },
        {
          name: "taker",
          docs: ["CHECK : in constraints"],
        },
        {
          name: "takerNftAtaMaker",
          writable: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "nftMetadataMaker",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "account",
                path: "metadataProgram",
              },
              {
                kind: "account",
                path: "nftMintMaker",
              },
            ],
            program: {
              kind: "account",
              path: "metadataProgram",
            },
          },
        },
        {
          name: "nftMasterEditionMaker",
          optional: true,
        },
        {
          name: "ownerTokenRecordMaker",
          writable: true,
          optional: true,
        },
        {
          name: "destinationTokenRecordMaker",
          writable: true,
          optional: true,
        },
        {
          name: "authRulesMaker",
          optional: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "metadataProgram",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "authRulesProgram",
        },
      ],
      args: [],
    },
    {
      name: "claimSwap22",
      discriminator: [2, 71, 161, 68, 27, 160, 38, 199],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountNftAta",
          writable: true,
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "nsFee",
          docs: ["CHECK : in constraints"],
          writable: true,
        },
        {
          name: "nsFeeTokenAta",
          writable: true,
        },
        {
          name: "taker",
          docs: ["CHECK : in constraints"],
          writable: true,
        },
        {
          name: "takerNftAtaMaker",
          writable: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "tokenProgram22",
        },
        {
          name: "ataProgram",
        },
      ],
      args: [],
    },
    {
      name: "claimSwapComp",
      discriminator: [56, 220, 147, 71, 118, 108, 37, 64],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "nsFee",
          docs: ["CHECK : in constraints"],
        },
        {
          name: "nsFeeTokenAta",
          writable: true,
        },
        {
          name: "taker",
          docs: ["CHECK : in constraints"],
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "treeAuthority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "merkleTree",
              },
            ],
            program: {
              kind: "account",
              path: "bubblegumProgram",
            },
          },
        },
        {
          name: "merkleTree",
          writable: true,
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "logWrapper",
        },
        {
          name: "compressionProgram",
        },
        {
          name: "bubblegumProgram",
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
        },
      ],
      args: [
        {
          name: "creatorHash",
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
          name: "root",
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
      name: "claimSwapCore",
      discriminator: [16, 165, 132, 93, 23, 254, 166, 9],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "nsFee",
          docs: ["CHECK : in constraints"],
        },
        {
          name: "nsFeeTokenAta",
          writable: true,
        },
        {
          name: "taker",
          docs: ["CHECK : in constraints"],
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
          writable: true,
        },
        {
          name: "collection",
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "coreProgram",
        },
      ],
      args: [],
    },
    {
      name: "closeBidAccount",
      discriminator: [18, 235, 188, 137, 65, 242, 93, 58],
      accounts: [
        {
          name: "bidAccount",
          writable: true,
        },
        {
          name: "signer",
          writable: true,
          signer: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "closeSwap",
      discriminator: [244, 111, 137, 155, 121, 104, 126, 143],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
      ],
      args: [],
    },
    {
      name: "createBidAccount",
      discriminator: [167, 148, 162, 241, 71, 210, 238, 221],
      accounts: [
        {
          name: "bidAccount",
          writable: true,
        },
        {
          name: "signer",
          writable: true,
          signer: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "proofs",
          type: {
            vec: "pubkey",
          },
        },
      ],
    },
    {
      name: "makeSwap",
      discriminator: [53, 60, 229, 243, 157, 94, 98, 186],
      accounts: [
        {
          name: "swapDataAccount",
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
                path: "nftMintMaker",
              },
            ],
          },
        },
        {
          name: "swapDataAccountNftAta",
          writable: true,
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
          signer: true,
        },
        {
          name: "makerNftAta",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
        },
        {
          name: "paymentMint",
        },
        {
          name: "nftMetadataMaker",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "account",
                path: "metadataProgram",
              },
              {
                kind: "account",
                path: "nftMintMaker",
              },
            ],
            program: {
              kind: "account",
              path: "metadataProgram",
            },
          },
        },
        {
          name: "nftMasterEditionMaker",
          optional: true,
        },
        {
          name: "ownerTokenRecordMaker",
          writable: true,
          optional: true,
        },
        {
          name: "destinationTokenRecordMaker",
          writable: true,
          optional: true,
        },
        {
          name: "authRulesMaker",
          optional: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "metadataProgram",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "authRulesProgram",
        },
      ],
      args: [
        {
          name: "bidToAdd",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "endTime",
          type: "i64",
        },
        {
          name: "isTraits",
          type: "bool",
        },
      ],
    },
    {
      name: "makeSwap22",
      discriminator: [164, 236, 205, 52, 222, 177, 64, 178],
      accounts: [
        {
          name: "swapDataAccount",
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
                path: "nftMintMaker",
              },
            ],
          },
        },
        {
          name: "swapDataAccountNftAta",
          writable: true,
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
          signer: true,
        },
        {
          name: "makerNftAta",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
        },
        {
          name: "paymentMint",
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "tokenProgram22",
        },
        {
          name: "ataProgram",
        },
      ],
      args: [
        {
          name: "bidToAdd",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "endDate",
          type: "i64",
        },
        {
          name: "isTraits",
          type: "bool",
        },
      ],
    },
    {
      name: "makeSwapComp",
      discriminator: [207, 55, 144, 111, 235, 221, 201, 172],
      accounts: [
        {
          name: "swapDataAccount",
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
                path: "tokenId",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
          signer: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "treeAuthority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "merkleTree",
              },
            ],
            program: {
              kind: "account",
              path: "bubblegumProgram",
            },
          },
        },
        {
          name: "merkleTree",
          writable: true,
        },
        {
          name: "tokenId",
        },
        {
          name: "paymentMint",
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "logWrapper",
        },
        {
          name: "compressionProgram",
        },
        {
          name: "bubblegumProgram",
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
        },
      ],
      args: [
        {
          name: "bidToAdd",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "endDate",
          type: "i64",
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
        {
          name: "isTraits",
          type: "bool",
        },
      ],
    },
    {
      name: "makeSwapCore",
      discriminator: [44, 178, 176, 37, 166, 110, 163, 109],
      accounts: [
        {
          name: "swapDataAccount",
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
                path: "nftMintMaker",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
          writable: true,
          signer: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "nftMintMaker",
          writable: true,
        },
        {
          name: "paymentMint",
        },
        {
          name: "collection",
        },
        {
          name: "coreProgram",
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
      ],
      args: [
        {
          name: "bidToAdd",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "endDate",
          type: "i64",
        },
        {
          name: "isTraits",
          type: "bool",
        },
      ],
    },
    {
      name: "overrideTime",
      discriminator: [50, 176, 30, 138, 244, 107, 76, 2],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
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
          name: "endTime",
          type: "i64",
        },
      ],
    },
    {
      name: "payRoyalties",
      discriminator: [49, 83, 229, 90, 55, 151, 131, 24],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "nftMetadata",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "account",
                path: "metadataProgram",
              },
              {
                kind: "account",
                path: "nftMint",
              },
            ],
            program: {
              kind: "account",
              path: "metadataProgram",
            },
          },
        },
        {
          name: "nftMint",
        },
        {
          name: "metadataProgram",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "creator0",
        },
        {
          name: "creator0TokenAta",
          writable: true,
        },
        {
          name: "creator1",
        },
        {
          name: "creator1TokenAta",
          writable: true,
        },
        {
          name: "creator2",
        },
        {
          name: "creator2TokenAta",
          writable: true,
        },
        {
          name: "creator3",
        },
        {
          name: "creator3TokenAta",
          writable: true,
        },
        {
          name: "creator4",
        },
        {
          name: "creator4TokenAta",
          writable: true,
        },
      ],
      args: [],
    },
    {
      name: "payRoyalties22",
      discriminator: [45, 146, 35, 158, 92, 10, 74, 82],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "nftMint",
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "tokenProgram22",
        },
      ],
      args: [],
    },
    {
      name: "payRoyaltiesComp",
      discriminator: [71, 14, 0, 184, 170, 143, 114, 147],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "owner",
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "merkleTree",
          writable: true,
        },
        {
          name: "tokenProgram",
        },
        {
          name: "compressionProgram",
        },
        {
          name: "creator0",
        },
        {
          name: "creator0TokenAta",
          writable: true,
        },
        {
          name: "creator1",
        },
        {
          name: "creator1TokenAta",
          writable: true,
        },
        {
          name: "creator2",
        },
        {
          name: "creator2TokenAta",
          writable: true,
        },
        {
          name: "creator3",
        },
        {
          name: "creator3TokenAta",
          writable: true,
        },
        {
          name: "creator4",
        },
        {
          name: "creator4TokenAta",
          writable: true,
        },
      ],
      args: [
        {
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "name",
          type: "string",
        },
        {
          name: "symbol",
          type: "string",
        },
        {
          name: "uri",
          type: "string",
        },
        {
          name: "sellerFeeBasisPoints",
          type: "u16",
        },
        {
          name: "primarySaleHappened",
          type: "bool",
        },
        {
          name: "isMutable",
          type: "bool",
        },
        {
          name: "editionNonce",
          type: {
            option: "u8",
          },
        },
        {
          name: "creators",
          type: {
            vec: {
              defined: {
                name: "cCreator",
              },
            },
          },
        },
        {
          name: "collection",
          type: {
            defined: {
              name: "cCollection",
            },
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
      name: "payRoyaltiesCore",
      discriminator: [160, 136, 87, 195, 165, 47, 227, 132],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "signer",
          signer: true,
        },
        {
          name: "nftMint",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "creator0",
        },
        {
          name: "creator0TokenAta",
          writable: true,
        },
        {
          name: "creator1",
        },
        {
          name: "creator1TokenAta",
          writable: true,
        },
        {
          name: "creator2",
        },
        {
          name: "creator2TokenAta",
          writable: true,
        },
        {
          name: "creator3",
        },
        {
          name: "creator3TokenAta",
          writable: true,
        },
        {
          name: "creator4",
        },
        {
          name: "creator4TokenAta",
          writable: true,
        },
      ],
      args: [],
    },
    {
      name: "removeBid",
      discriminator: [67, 240, 240, 181, 3, 42, 61, 57],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
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
          name: "removeBid",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
      ],
    },
    {
      name: "takeSwap",
      discriminator: [82, 194, 146, 185, 78, 77, 212, 139],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "bidAccount",
          optional: true,
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
        },
        {
          name: "makerNftAta",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "taker",
          writable: true,
          signer: true,
        },
        {
          name: "takerNftAta",
          writable: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "nftMintTaker",
        },
        {
          name: "nftMetadataTaker",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 101, 116, 97, 100, 97, 116, 97],
              },
              {
                kind: "account",
                path: "metadataProgram",
              },
              {
                kind: "account",
                path: "nftMintTaker",
              },
            ],
            program: {
              kind: "account",
              path: "metadataProgram",
            },
          },
        },
        {
          name: "nftMasterEditionTaker",
          optional: true,
        },
        {
          name: "ownerTokenRecordTaker",
          writable: true,
          optional: true,
        },
        {
          name: "destinationTokenRecordTaker",
          writable: true,
          optional: true,
        },
        {
          name: "authRulesTaker",
          optional: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "metadataProgram",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "ataProgram",
        },
        {
          name: "authRulesProgram",
        },
      ],
      args: [
        {
          name: "bidToAccept",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "n",
          type: {
            option: "u8",
          },
        },
        {
          name: "traitIndex",
          type: {
            option: "u32",
          },
        },
        {
          name: "traitProof",
          type: {
            option: {
              vec: "pubkey",
            },
          },
        },
      ],
    },
    {
      name: "takeSwap22",
      discriminator: [73, 19, 84, 21, 81, 158, 142, 69],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "bidAccount",
          optional: true,
        },
        {
          name: "maker",
        },
        {
          name: "makerNftAta",
          writable: true,
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "taker",
          writable: true,
          signer: true,
        },
        {
          name: "takerNftAta",
          writable: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "nftMintTaker",
        },
        {
          name: "hashlistMarker",
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "tokenProgram22",
        },
        {
          name: "ataProgram",
        },
      ],
      args: [
        {
          name: "bidToAccept",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "n",
          type: {
            option: "u8",
          },
        },
        {
          name: "traitIndex",
          type: {
            option: "u32",
          },
        },
        {
          name: "traitProof",
          type: {
            option: {
              vec: "pubkey",
            },
          },
        },
      ],
    },
    {
      name: "takeSwapComp",
      discriminator: [51, 70, 94, 77, 30, 242, 36, 153],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "maker",
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "treeAuthority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "merkleTree",
              },
            ],
            program: {
              kind: "account",
              path: "bubblegumProgram",
            },
          },
        },
        {
          name: "merkleTree",
          writable: true,
        },
        {
          name: "taker",
          writable: true,
          signer: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "logWrapper",
        },
        {
          name: "compressionProgram",
        },
        {
          name: "bubblegumProgram",
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
        },
      ],
      args: [
        {
          name: "bidCollection",
          type: {
            defined: {
              name: "cCollection",
            },
          },
        },
        {
          name: "bidTakerAmount",
          type: "i64",
        },
        {
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "name",
          type: "string",
        },
        {
          name: "symbol",
          type: "string",
        },
        {
          name: "uri",
          type: "string",
        },
        {
          name: "sellerFeeBasisPoints",
          type: "u16",
        },
        {
          name: "primarySaleHappened",
          type: "bool",
        },
        {
          name: "isMutable",
          type: "bool",
        },
        {
          name: "editionNonce",
          type: {
            option: "u8",
          },
        },
        {
          name: "creators",
          type: {
            vec: {
              defined: {
                name: "cCreator",
              },
            },
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
        {
          name: "n",
          type: {
            option: "u8",
          },
        },
      ],
    },
    {
      name: "takeSwapCompTraits",
      discriminator: [57, 41, 46, 77, 231, 46, 206, 228],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "bidAccount",
        },
        {
          name: "maker",
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "treeAuthority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "merkleTree",
              },
            ],
            program: {
              kind: "account",
              path: "bubblegumProgram",
            },
          },
        },
        {
          name: "merkleTree",
          writable: true,
        },
        {
          name: "taker",
          writable: true,
          signer: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "systemProgram",
          address: "11111111111111111111111111111111",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "logWrapper",
        },
        {
          name: "compressionProgram",
        },
        {
          name: "bubblegumProgram",
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
        },
      ],
      args: [
        {
          name: "bidTakerAmount",
          type: "i64",
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
        {
          name: "traitIndex",
          type: "u32",
        },
        {
          name: "traitProof",
          type: {
            vec: "pubkey",
          },
        },
        {
          name: "n",
          type: {
            option: "u8",
          },
        },
      ],
    },
    {
      name: "takeSwapCore",
      discriminator: [199, 209, 161, 30, 107, 131, 134, 234],
      accounts: [
        {
          name: "swapDataAccount",
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
                account: "swapData",
              },
              {
                kind: "account",
                path: "swap_data_account.nft_mint_maker",
                account: "swapData",
              },
            ],
          },
        },
        {
          name: "swapDataAccountTokenAta",
          writable: true,
        },
        {
          name: "bidAccount",
          optional: true,
        },
        {
          name: "maker",
        },
        {
          name: "makerTokenAta",
          writable: true,
        },
        {
          name: "taker",
          writable: true,
          signer: true,
        },
        {
          name: "takerTokenAta",
          writable: true,
        },
        {
          name: "nftMintTaker",
          writable: true,
        },
        {
          name: "collection",
        },
        {
          name: "sysvarInstructions",
        },
        {
          name: "tokenProgram",
        },
        {
          name: "coreProgram",
        },
      ],
      args: [
        {
          name: "bidToAccept",
          type: {
            defined: {
              name: "bid",
            },
          },
        },
        {
          name: "n",
          type: {
            option: "u8",
          },
        },
        {
          name: "traitIndex",
          type: {
            option: "u32",
          },
        },
        {
          name: "traitProof",
          type: {
            option: {
              vec: "pubkey",
            },
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "bidAccount",
      discriminator: [27, 161, 15, 114, 230, 126, 56, 104],
    },
    {
      name: "swapData",
      discriminator: [107, 253, 23, 129, 228, 108, 158, 32],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "emptyBids",
      msg: "List of Bids is empty",
    },
    {
      code: 6001,
      name: "bidAlreadyExists",
      msg: "Bid already exists",
    },
    {
      code: 6002,
      name: "incorrectMint",
      msg: "Incorrect Mint",
    },
    {
      code: 6003,
      name: "seedLengthIncorrect",
      msg: "Given seed length is Incorrect",
    },
    {
      code: 6004,
      name: "unexpectedState",
      msg: "The status given is not correct",
    },
    {
      code: 6005,
      name: "incorrectFeeAccount",
      msg: "Fee Account is not correct",
    },
    {
      code: 6006,
      name: "incorrectDate",
      msg: "Date given is incorrect",
    },
    {
      code: 6007,
      name: "incorrectAmount",
      msg: "Amount given is incorrect",
    },
    {
      code: 6008,
      name: "incorrectPayment",
      msg: "Incorrect Payment Mint",
    },
    {
      code: 6009,
      name: "noAcceptedBidFound",
      msg: "You need to take swap before claimimg it",
    },
    {
      code: 6010,
      name: "notClaimed",
      msg: "You need to claim swap before closing it",
    },
    {
      code: 6011,
      name: "incorrectTraitRootVerification",
      msg: "Incorrect trait proof",
    },
    {
      code: 6012,
      name: "notTraitSwap",
      msg: "Not a Trait Swap",
    },
    {
      code: 6013,
      name: "notNativeSwap",
      msg: "Not a Native Swap",
    },
    {
      code: 6100,
      name: "notMaker",
      msg: "wrong signer, only maker can perform this action",
    },
    {
      code: 6101,
      name: "notTaker",
      msg: "wrong address for Taker",
    },
    {
      code: 6102,
      name: "incorrectOwner",
      msg: "Owner Given is incorrect",
    },
    {
      code: 6200,
      name: "unVerifiedCollection",
      msg: "Collection is unverified",
    },
    {
      code: 6201,
      name: "incorrectCollection",
      msg: "Collection doesnt't match givent mint collection",
    },
    {
      code: 6202,
      name: "unVerifiedCreator",
      msg: "Creator is unverified",
    },
    {
      code: 6203,
      name: "incorrectCreator",
      msg: "Creator passed is incorrect",
    },
    {
      code: 6204,
      name: "notCoreAsset",
      msg: "Asset is not a Mpl Core asset",
    },
    {
      code: 6300,
      name: "alreadyExist",
      msg: "The item you're trying to add already exists in the SDA",
    },
    {
      code: 6301,
      name: "cannotFindAccount",
      msg: "Cannot find the account",
    },
    {
      code: 6302,
      name: "incorrectState",
      msg: "Swap is not in the adequate state to perform this action",
    },
    {
      code: 6303,
      name: "collectionNotFound",
      msg: "Cannot find the given collection in the SDA",
    },
    {
      code: 6304,
      name: "alreadyTaken",
      msg: "Swap already accepted",
    },
    {
      code: 6305,
      name: "notTaken",
      msg: "Swap not taken yet",
    },
    {
      code: 6306,
      name: "alreadyClaimed",
      msg: "Swap already claimed",
    },
    {
      code: 6307,
      name: "royaltiesAlreadyPaid",
      msg: "Royalties already paied",
    },
    {
      code: 6308,
      name: "bidNotFound",
      msg: "Bid not found in the list of bids",
    },
    {
      code: 6309,
      name: "feeNotPaid",
      msg: "Fees are not paid, please pay the fees before closing the swap",
    },
    {
      code: 6310,
      name: "tooLate",
      msg: "the Swap you tried to accept is expired",
    },
    {
      code: 6311,
      name: "tooEarly",
      msg: "Too early to perform this action",
    },
    {
      code: 6400,
      name: "transferNftFailed",
      msg: "NFT Transfer failed",
    },
    {
      code: 6900,
      name: "incorrectSysvar",
      msg: "Incorrect Sysvar Instruction Program",
    },
    {
      code: 6901,
      name: "incorrectMetadata",
      msg: "Incorrect Metadata Program",
    },
    {
      code: 6902,
      name: "incorrectSplAta",
      msg: "Incorrect Token ATA Program",
    },
    {
      code: 6903,
      name: "incorrectTokenProgram",
      msg: "Incorrect Token Program",
    },
    {
      code: 6904,
      name: "incorrectCoreProgram",
      msg: "Incorrect Core Program",
    },
  ],
  types: [
    {
      name: "bid",
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
    {
      name: "bidAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "pubkey",
          },
          {
            name: "roots",
            type: {
              vec: "pubkey",
            },
          },
        ],
      },
    },
    {
      name: "cCollection",
      type: {
        kind: "struct",
        fields: [
          {
            name: "key",
            type: "pubkey",
          },
          {
            name: "verified",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "cCreator",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "pubkey",
          },
          {
            name: "verified",
            type: "bool",
          },
          {
            name: "share",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "swapData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "maker",
            type: "pubkey",
          },
          {
            name: "nftMintMaker",
            type: "pubkey",
          },
          {
            name: "bids",
            type: {
              vec: {
                defined: {
                  name: "bid",
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
            name: "nftMintTaker",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "acceptedBid",
            type: {
              option: {
                defined: {
                  name: "bid",
                },
              },
            },
          },
          {
            name: "refererMaker",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "refererTaker",
            type: {
              option: "pubkey",
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
            name: "claimed",
            type: "bool",
          },
          {
            name: "swapType",
            type: {
              defined: {
                name: "swapType",
              },
            },
          },
          {
            name: "paymentMint",
            type: "pubkey",
          },
        ],
      },
    },
    {
      name: "swapType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "native",
          },
          {
            name: "trait",
          },
        ],
      },
    },
  ],
} as CollectionSwap;

export type CollectionSwap = {
  address: string;
  metadata: {
    name: "collectionSwap";
    version: "0.5.0";
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
      name: "cancelSwapComp";
      discriminator: [178, 93, 63, 195, 14, 39, 40, 171];
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
          name: "treeAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "merkleTree";
              }
            ];
            program: {
              kind: "account";
              path: "bubblegumProgram";
            };
          };
        },
        {
          name: "merkleTree";
          writable: true;
        },
        {
          name: "logWrapper";
        },
        {
          name: "compressionProgram";
        },
        {
          name: "bubblegumProgram";
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY";
        },
        {
          name: "makerTokenAta";
          writable: true;
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
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "creatorHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        }
      ];
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
      name: "claimSwapComp";
      discriminator: [56, 220, 147, 71, 118, 108, 37, 64];
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
          name: "treeAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "merkleTree";
              }
            ];
            program: {
              kind: "account";
              path: "bubblegumProgram";
            };
          };
        },
        {
          name: "merkleTree";
          writable: true;
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
          name: "logWrapper";
        },
        {
          name: "compressionProgram";
        },
        {
          name: "bubblegumProgram";
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY";
        }
      ];
      args: [
        {
          name: "creatorHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        }
      ];
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
      name: "closeBidAccount";
      discriminator: [18, 235, 188, 137, 65, 242, 93, 58];
      accounts: [
        {
          name: "bidAccount";
          writable: true;
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
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
      name: "createBidAccount";
      discriminator: [167, 148, 162, 241, 71, 210, 238, 221];
      accounts: [
        {
          name: "bidAccount";
          writable: true;
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "proofs";
          type: {
            vec: "pubkey";
          };
        }
      ];
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
          name: "endTime";
          type: "i64";
        },
        {
          name: "isTraits";
          type: "bool";
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
        },
        {
          name: "isTraits";
          type: "bool";
        }
      ];
    },
    {
      name: "makeSwapComp";
      discriminator: [207, 55, 144, 111, 235, 221, 201, 172];
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
                path: "tokenId";
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
          name: "treeAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "merkleTree";
              }
            ];
            program: {
              kind: "account";
              path: "bubblegumProgram";
            };
          };
        },
        {
          name: "merkleTree";
          writable: true;
        },
        {
          name: "tokenId";
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
          name: "ataProgram";
        },
        {
          name: "logWrapper";
        },
        {
          name: "compressionProgram";
        },
        {
          name: "bubblegumProgram";
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY";
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
        },
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "creatorHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        },
        {
          name: "isTraits";
          type: "bool";
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
        },
        {
          name: "isTraits";
          type: "bool";
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
      name: "payRoyaltiesComp";
      discriminator: [71, 14, 0, 184, 170, 143, 114, 147];
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
          name: "owner";
        },
        {
          name: "signer";
          signer: true;
        },
        {
          name: "merkleTree";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "compressionProgram";
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
      args: [
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "symbol";
          type: "string";
        },
        {
          name: "uri";
          type: "string";
        },
        {
          name: "sellerFeeBasisPoints";
          type: "u16";
        },
        {
          name: "primarySaleHappened";
          type: "bool";
        },
        {
          name: "isMutable";
          type: "bool";
        },
        {
          name: "editionNonce";
          type: {
            option: "u8";
          };
        },
        {
          name: "creators";
          type: {
            vec: {
              defined: {
                name: "cCreator";
              };
            };
          };
        },
        {
          name: "collection";
          type: {
            defined: {
              name: "cCollection";
            };
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        }
      ];
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
          name: "bidAccount";
          optional: true;
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
        },
        {
          name: "n";
          type: {
            option: "u8";
          };
        },
        {
          name: "traitIndex";
          type: {
            option: "u32";
          };
        },
        {
          name: "traitProof";
          type: {
            option: {
              vec: "pubkey";
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
          name: "bidAccount";
          optional: true;
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
        },
        {
          name: "n";
          type: {
            option: "u8";
          };
        },
        {
          name: "traitIndex";
          type: {
            option: "u32";
          };
        },
        {
          name: "traitProof";
          type: {
            option: {
              vec: "pubkey";
            };
          };
        }
      ];
    },
    {
      name: "takeSwapComp";
      discriminator: [51, 70, 94, 77, 30, 242, 36, 153];
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
          name: "treeAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "merkleTree";
              }
            ];
            program: {
              kind: "account";
              path: "bubblegumProgram";
            };
          };
        },
        {
          name: "merkleTree";
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
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "logWrapper";
        },
        {
          name: "compressionProgram";
        },
        {
          name: "bubblegumProgram";
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY";
        }
      ];
      args: [
        {
          name: "bidCollection";
          type: {
            defined: {
              name: "cCollection";
            };
          };
        },
        {
          name: "bidTakerAmount";
          type: "i64";
        },
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "symbol";
          type: "string";
        },
        {
          name: "uri";
          type: "string";
        },
        {
          name: "sellerFeeBasisPoints";
          type: "u16";
        },
        {
          name: "primarySaleHappened";
          type: "bool";
        },
        {
          name: "isMutable";
          type: "bool";
        },
        {
          name: "editionNonce";
          type: {
            option: "u8";
          };
        },
        {
          name: "creators";
          type: {
            vec: {
              defined: {
                name: "cCreator";
              };
            };
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        },
        {
          name: "n";
          type: {
            option: "u8";
          };
        }
      ];
    },
    {
      name: "takeSwapCompTraits";
      discriminator: [57, 41, 46, 77, 231, 46, 206, 228];
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
          name: "bidAccount";
        },
        {
          name: "maker";
        },
        {
          name: "makerTokenAta";
          writable: true;
        },
        {
          name: "treeAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "merkleTree";
              }
            ];
            program: {
              kind: "account";
              path: "bubblegumProgram";
            };
          };
        },
        {
          name: "merkleTree";
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
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "logWrapper";
        },
        {
          name: "compressionProgram";
        },
        {
          name: "bubblegumProgram";
          address: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY";
        }
      ];
      args: [
        {
          name: "bidTakerAmount";
          type: "i64";
        },
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "creatorHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        },
        {
          name: "traitIndex";
          type: "u32";
        },
        {
          name: "traitProof";
          type: {
            vec: "pubkey";
          };
        },
        {
          name: "n";
          type: {
            option: "u8";
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
          name: "bidAccount";
          optional: true;
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
        },
        {
          name: "n";
          type: {
            option: "u8";
          };
        },
        {
          name: "traitIndex";
          type: {
            option: "u32";
          };
        },
        {
          name: "traitProof";
          type: {
            option: {
              vec: "pubkey";
            };
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "bidAccount";
      discriminator: [27, 161, 15, 114, 230, 126, 56, 104];
    },
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
      code: 6011;
      name: "incorrectTraitRootVerification";
      msg: "Incorrect trait proof";
    },
    {
      code: 6012;
      name: "notTraitSwap";
      msg: "Not a Trait Swap";
    },
    {
      code: 6013;
      name: "notNativeSwap";
      msg: "Not a Native Swap";
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
      name: "notTaken";
      msg: "Swap not taken yet";
    },
    {
      code: 6306;
      name: "alreadyClaimed";
      msg: "Swap already claimed";
    },
    {
      code: 6307;
      name: "royaltiesAlreadyPaid";
      msg: "Royalties already paied";
    },
    {
      code: 6308;
      name: "bidNotFound";
      msg: "Bid not found in the list of bids";
    },
    {
      code: 6309;
      name: "feeNotPaid";
      msg: "Fees are not paid, please pay the fees before closing the swap";
    },
    {
      code: 6310;
      name: "tooLate";
      msg: "the Swap you tried to accept is expired";
    },
    {
      code: 6311;
      name: "tooEarly";
      msg: "Too early to perform this action";
    },
    {
      code: 6400;
      name: "transferNftFailed";
      msg: "NFT Transfer failed";
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
      name: "bidAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "roots";
            type: {
              vec: "pubkey";
            };
          }
        ];
      };
    },
    {
      name: "cCollection";
      type: {
        kind: "struct";
        fields: [
          {
            name: "key";
            type: "pubkey";
          },
          {
            name: "verified";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "cCreator";
      type: {
        kind: "struct";
        fields: [
          {
            name: "address";
            type: "pubkey";
          },
          {
            name: "verified";
            type: "bool";
          },
          {
            name: "share";
            type: "u8";
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
            name: "swapType";
            type: {
              defined: {
                name: "swapType";
              };
            };
          },
          {
            name: "paymentMint";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "swapType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "native";
          },
          {
            name: "trait";
          }
        ];
      };
    }
  ];
};
