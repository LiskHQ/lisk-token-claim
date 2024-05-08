# Taking Snapshot & Merkle Tree Generation

## Background

This document focuses on converting a Lisk Snapshot to Merkle Tree using `tree-builder`.
The Merkle Trees are used for the Token Migration and future airdrops.

## Merkle Trees

There are 2 planned Merkle Trees for Lisk:

1. **Lisk Token Migration** - The main Merkle Tree to let users migrate their LSK Token from Lisk L1 to LSK L2 Network (L2 Chain).
2. **Migration Airdrop** - A Merkle Tree that rewards LSK holders for migrating from Lisk L1 to Lisk L2

## Pre-Requisite

- Node v18
- yarn

## Preparation

1. Download and extract blockchain data of block [24,823,618](https://snapshots.lisk.com/mainnet/blockchain-24823618.db.tar.gz) from [Lisk Snapshots](https://snapshots.lisk.com/mainnet/). Blockchain data will be available soon after the block height has reached.

   ```
   # Estimated Available Date: 21 May, 2024 (0800 CET)
   curl https://snapshots.lisk.com/mainnet/blockchain-24823618.db.tar.gz -o ./blockchain.db.tar.gz

   # OR download the latest snapshot available
   # curl https://snapshots.lisk.com/mainnet/blockchain.db.tar.gz -o ./blockchain.db.tar.gz

   tar -zxvf ./blockchain.db.tar.gz
   ```

2. Clone and install `lisk-token-claim`.
   ```
   git clone git@github.com:LiskHQ/lisk-token-claim.git && cd lisk-token-claim
   yarn && yarn build
   ```
3. Navigate to `tree-builder`.
   ```
   cd packages/tree-builder
   ```

## Generate Merkle Tree

After running the following command, `accounts.json`, `merkle-root.json`, `merkle-tree-result.json` and `merkle-tree-result-detailed.json` will be generated.
The descriptions of the above files can be found at [Tech Design](./Tech_Design.md) and [Tree Builder README](../packages/tree-builder/README.md).

### Lisk Token Migration

Generate merkle tree for Lisk Token Migration.

| Flag                    | Description                                                                                                                                                                  | Required | Default            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| db-path                 | Database path, where your state.db is located. If following the preparation stage above, db-path would be `../../../`                                                        | True     |                    |
| output-path             | Destination path of the merkle tree                                                                                                                                          | False    | `./data`           |
| token-id                | Token ID, use default for mainnet LSK Token                                                                                                                                  | False    | `0000000000000000` |
| excluded-addresses-path | File Path of List of addresses excluded from airdrop. Exact addresses to be exlucded from Migration has been stored in `lisk-token-claim/data/mainnet/exclude_addresses.txt` | False    | `""`               |

```
# Create a separate folder to store Merkle Tree for Migration
mkdir -p ./migration

./bin/run.js generate-merkle-tree \
--db-path=../../../ \
--output-path=./migration \
--token-id=0000000000000000 \
--excluded-addresses-path=../../data/mainnet/exclude_addresses.txt
```

### Migration Airdrop

Generate merkle tree for Migration Airdrop.

| Flag                    | Description                                                                                                                                                                        | Required | Default            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| db-path                 | Database path, where your state.db is located                                                                                                                                      | True     |                    |
| output-path             | Destination path of the merkle tree                                                                                                                                                | False    | `./data`           |
| token-id                | Token ID, use default for mainnet LSK Token                                                                                                                                        | False    | `0000000000000000` |
| cutoff                  | Minimal amount of LSK required to participate in the migration airdrop                                                                                                             | False    | `50`               |
| whale-cap               | Cap on the LSK amount of a single Lisk L1 account to be used for the airdrop computation                                                                                           | False    | `250000`           |
| airdrop-percent         | The airdrop amount is equal to the given percentage of LSK balance, after whale cap and cutoff are applied                                                                         | False    | `10`               |
| excluded-addresses-path | File Path of List of addresses excluded from airdrop. Exact addresses to be exlucded from Airdrop has been stored in `lisk-token-claim/data/mainnet/exclude_airdrop_addresses.txt` | False    | `""`               |

```
# Create a separate folder to store Merkle Tree for Airdrop
mkdir -p ./airdrop-migration

./bin/run.js generate-airdrop-merkle-tree \
--db-path=../../../ \
--output-path=./airdrop-migration \
--token-id=0000000000000000 \
--cutoff 50 \
--whale-cap 250000 \
--airdrop-percent 10 \
--excluded-addresses-path=../../data/mainnet/excluded_airdrop_addresses.txt
```
