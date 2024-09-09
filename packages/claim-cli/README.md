# Claim CLI

This library is a tool to claim Lisk tokens without the need for UI. This tool can provide the following services:

- Check Eligibility
- Submit a Claim
- Publish a Multisig claim with completed signatures onchain

![cli_screenshot.png](../../documentation/Claim_CLI/cli_screenshot.png)

## Run

```
# Navigate to claim-cli package
cd packages/claim-cli

# Install dependencies
yarn && yarn build

# Start Claim CLI on mainnet
./bin/run.js

# Or start Claim CLI on testnet
# ./bin/run.js --network testnet
```

## Usage

Detailed guide to Claim CLI is located in [Detailed Guide to Claim CLI Tool](../../documentation/Detailed_Claim_CLI.md).

## Workflow

### Check Eligibility

![check_eligibility.png](../../documentation/Claim_CLI/check_eligibility.png)

### Submit a Claim

![img_2.png](../../documentation/Claim_CLI/submit_a_claim.png)

### Publish a Multisig claim with completed signatures onchain

![submit_multisig.png](../../documentation/Claim_CLI/submit_multisig.png)
