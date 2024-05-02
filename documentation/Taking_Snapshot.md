# Taking Snapshot & Merkle Tree Generation

## Background

This document focuses on converting Lisk Snapshot to Merkle Tree using `tree-builder`.
Which the Merkle Tree is used for Token Migration and future Airdrops.

## Merkle Trees

There are 2 planned Merkle Tree from Lisk:

1. **Lisk Token Migration** - The main Merkle Tree to let allow users migrate their LSK Token from Lisk Mainchain (Lisk Chain) to LSK L2 Network (L2 Chain).
2. **Migration Airdrop** - A Merkle Tree that rewards LSK holders for migrating from Lisk v4 to Lisk L2

## Pre-Requisite

- Node v18
- yarn

## Preparation

1. Download and extract blockchain data of block [24,823,618](https://snapshots.lisk.com/mainnet/blockchain-24823618.db.tar.gz) from Lisk Snapshots. Blockchain data will be available soon after the block height has reached.
   ```
   # Estimated Available Date: 21 May, 2024 (0800 CET)
   $ curl https://snapshots.lisk.com/mainnet/blockchain-24823618.db.tar.gz -o /path/to/blockchain.db.tar.gz
   $ tar -zxvf /path/to/blockchain.db.tar.gz
   ```
2. Clone and install `lisk-token-claim`.
   ```
   $ git clone git@github.com:LiskHQ/lisk-token-claim.git && cd lisk-token-claim
   $ yarn && yarn build
   ```
3. Navigate to `tree-builder`.
   ```
   $ cd packages/tree-builder
   ```
4. (Optional) Prepare `exclude_addresses.txt` and `exclude_airdrop_addresses.txt` \
   Addresses can be added to a text file, separated by line-break.
   ```
   $ echo <excludeaddress> >> excluded_airdrop_addresses.txt
   ```

## Generate Merkle Tree

After running the following command, `accounts.json`, `merkle-root.json`, `merkle-tree-result.json` and `merkle-tree-result-detailed.json` will be generated.
The descriptions of the above files can be found at [Tech Design](./Tech_Design.md) and [Tree Builder README](../packages/tree-builder/README.md).

### Lisk Token Migration

Generate merkle tree for Lisk Token Migration.

| Flag                    | Description                                          | Required | Default            |
| ----------------------- | ---------------------------------------------------- | -------- | ------------------ |
| db-path                 | Database path, where your state.db is located        | True     |                    |
| output-path             | Destination path of the merkle tree                  | False    | `./data`           |
| token-id                | Token ID, use default for mainnet LSK Token          | False    | `0000000000000000` |
| excluded-addresses-path | File Path of List of addresses excluded from airdrop | False    | `""`               |

```
# Create a separate folder to store Merkle Tree for Migration
$ mkdir -p /path/to/migration

$ ./bin/run.js generate-merkle-tree \
--db-path=/path/to \
--output-path=/path/to/migration \
--token-id=0000000000000000 \
--excluded-addresses-path=../../data/mainnet/exclude_addresses.txt
```

### Migration Airdrop

Generate merkle tree for Migration Airdrop.

| Flag                    | Description                                                                                                | Required | Default            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| db-path                 | Database path, where your state.db is located                                                              | True     |                    |
| output-path             | Destination path of the merkle tree                                                                        | False    | `./data`           |
| token-id                | Token ID, use default for mainnet LSK Token                                                                | False    | `0000000000000000` |
| cutoff                  | Minimal amount of LSK required to participate in the migration airdrop                                     | False    | `50`               |
| whale-cap               | Cap on the LSK amount of a single Lisk v4 account to be used for the airdrop computation                   | False    | `250000`           |
| airdrop-percent         | The airdrop amount is equal to the given percentage of LSK balance, after whale cap and cutoff are applied | False    | `10`               |
| excluded-addresses-path | File Path of List of addresses excluded from airdrop                                                       | False    | `""`               |

```
# Create a separate folder to store Merkle Tree for Airdrop
$ mkdir -p /path/to/airdrop

$ ./bin/run.js generate-airdrop-merkle-tree \
--db-path=/path/to \
--output-path=/path/to/airdrop \
--token-id=0000000000000000 \
--cutoff 50 \
--whale-cap 250000 \
--airdrop-percent 10 \
--excluded-addresses-path=../../data/mainnet/excluded_airdrop_addresses.txt
```
