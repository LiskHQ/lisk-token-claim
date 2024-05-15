# Taking Snapshot & Merkle Tree Generation

## Background

This document focuses on generating the Merkle Tree from a Lisk Core snapshot using `tree-builder`.
The Merkle Tree is used for the Token Migration, which lets the user migrate their LSK Token from the Lisk L1 to the LSK L2 Network (L2 Chain).

## Pre-Requisite

- NodeJS v18
- yarn
- jq

## Preparation

1. Synchronize blockchain using `lisk-core`. The node will automatically shut down itself after about a round after the Snapshot Height (#24,823,618) has been finalized, i.e. block #24,823,721 is finalized. Under ideal conditions, this might take about ~40-45 mins after the block at Snapshot Height is generated.
   After synchronization, the snapshot data for the specified height (`system.backup.height`) in the Lisk Core node config can be found in `./snapshot/backup/`.

   > **Synchronization from scratch may take up to days.**

   ```
   # Record current path
   LISK_HOME=$(pwd)

   # Create snapshot folder as data path
   mkdir ./snapshot

   # Using version v4.0.6
   git clone -b v4.0.6 https://github.com/LiskHQ/lisk-core.git && cd lisk-core

   # Verify Backup height is correct and in place
   cat config/mainnet/config.json | jq ".system.backup.height"   # 24823618

   # Install dependencies and build lisk-core
   yarn install --frozen-lockfile && yarn build

   # Start lisk-core and let it keep running until synchronization has completed and reached block #24,823,618
   # Estimated Available Date: 21 May, 2024 (0800 CET)
   ./bin/run start --network mainnet --data-path ../snapshot --overwrite-config
   ```

2. Go back to home directory, or start a new terminal if the `lisk-core` instance is still running, clone and install `lisk-token-claim`.
   ```
   cd $LISK_HOME
   git clone https://github.com/LiskHQ/lisk-token-claim.git
   ```
   At this stage, your directory structure should look like this:
   ```
   $LISK_HOME/
   ├─ snapshot/
   │  ├─ backup/
   │  │  ├─ blockchain.db
   │  │  ├─ state.db
   │  ├─ ....
   ├─ lisk-core/
   ├─ lisk-token-claim/
   ```
3. Navigate to `tree-builder` inside `lisk-token-claim` and install dependencies along the way.

   ```
   # Enter lisk-token-claim
   cd lisk-token-claim

   # Install dependencies
   yarn install --frozen-lockfile && yarn build

   # Navigate to tree-builder
   cd packages/tree-builder
   ```

## Generate Merkle Tree

After running the following command, `accounts.json`, `merkle-root.json`, `merkle-tree-result.json` and `merkle-tree-result-detailed.json` will be generated.
The descriptions of the above files can be found at [Tech Design](./Tech_Design.md) and [Tree Builder README](../packages/tree-builder/README.md).

### Lisk Token Migration

Generate merkle tree for Lisk Token Migration.

| Flag                    | Description                                                                                                                                                                    | Required | Default            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------ |
| db-path                 | Database path, where your state.db is located. If following the preparation stage above, db-path would be `../../../`                                                          | True     |                    |
| output-path             | Destination path of the merkle tree                                                                                                                                            | False    | `./data`           |
| token-id                | Token ID, use default for mainnet LSK Token                                                                                                                                    | False    | `0000000000000000` |
| excluded-addresses-path | File Path of List of addresses excluded from Migration. Exact addresses to be excluded from Migration has been stored in `lisk-token-claim/data/mainnet/exclude_addresses.txt` | False    | `""`               |

```
# Create a separate folder to store Merkle Tree for Migration
mkdir -p ./migration

./bin/run.js generate-merkle-tree \
--db-path=../../../snapshot/backup \
--output-path=./migration \
--token-id=0000000000000000 \
--excluded-addresses-path=../../data/mainnet/exclude_addresses.txt
```

After Merkle Tree generation, the Merkle Root can be verified from `./migration/merkle-root.json`.

```
cat migration/merkle-root.json | jq ".merkleRoot"
```
