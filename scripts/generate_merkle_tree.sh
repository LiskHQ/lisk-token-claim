#!/bin/bash

S3_BUCKET_NAME="lisk-migration-assets"
FOLDER_NAME="token-claim"
OUTPUT_DIR="./data/$FOLDER_NAME"

NETWORK="testnet"
if [ -n "$1" ]; then
    NETWORK="$1"
fi

SNAPSHOT_URL="https://snapshots.lisk.com/$NETWORK/blockchain.db.tar.gz"
EXCLUDE_ADDRESSES_PATH="./data/$NETWORK/exclude_addresses.txt"
EXCLUDE_AIRDROP_ADDRESSES_PATH="./data/$NETWORK/excluded_airdrop_addresses.txt"
OUTPUT_DIR_CLAIM="$OUTPUT_DIR/claim"
OUTPUT_DIR_AIRDROP="$OUTPUT_DIR/airdrop"

if [ "$NETWORK" = "mainnet" ]; then
    TOKEN_ID="0000000000000000"
else
    TOKEN_ID="0100000000000000"
fi

if [ ! -d "./tmp" ]; then
    mkdir -p ./tmp
fi

if [ ! -f "./tmp/blockchain.db.tar.gz" ]; then
    curl -o ./tmp/blockchain.db.tar.gz $SNAPSHOT_URL
fi

if [ ! -d "./tmp/blockchain.db" ]; then
    tar -xzf ./tmp/blockchain.db.tar.gz -C ./tmp
else
    echo "Blockchain database folder already exists"
fi

if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir -p $OUTPUT_DIR
else
    echo "Output folder already exists"
fi

if [ ! -d "$OUTPUT_DIR_CLAIM" ]; then
    mkdir -p $OUTPUT_DIR_CLAIM
else
    echo "Claim output folder already exists"
fi

if [ ! -d "$OUTPUT_DIR_AIRDROP" ]; then
    mkdir -p $OUTPUT_DIR_AIRDROP
else
    echo "Claim output folder already exists"
fi

./packages/tree-builder/bin/run.js generate-merkle-tree --db-path=./tmp --output-path=$OUTPUT_DIR_CLAIM --token-id=$TOKEN_ID --excluded-addresses-path $EXCLUDE_ADDRESSES_PATH || exit 1
./packages/tree-builder/bin/run.js generate-airdrop-merkle-tree --db-path=./tmp --output-path=$OUTPUT_DIR_AIRDROP --token-id=$TOKEN_ID --excluded-addresses-path $EXCLUDE_AIRDROP_ADDRESSES_PATH || exit 1

# Upload files in $OUTPUT_DIR to S3 with folder token-claim
aws s3 cp $OUTPUT_DIR s3://$S3_BUCKET_NAME/$FOLDER_NAME/$NETWORK --recursive
