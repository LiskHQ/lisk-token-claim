# Lisk Token Claim <!-- omit in toc -->

This repository is a monorepo for essential non-contract services for the LSK Token Claim on the Lisk L2.

## Table of Contents <!-- omit in toc -->

- [Packages](#packages)
  - [Tree Builder](#tree-builder)
  - [Token Claim Backend](#claim-backend)
  - [Token Claim CLI](#claim-cli)
- [Setup and Installation](#setup-and-installation)
- [Docker](#docker)
- [Contributing](#contributing)
- [License](#license)

## Packages

In this monorepo there are currently 2 packages:

### [Tree Builder](packages/tree-builder)

Builds a Merkle Tree from a snapshot and computes the Merkle Root.

### [Claim Backend](packages/claim-backend)

Perform as a backend server, compatible with JSON RPC 2.0 Standard.

The database is using PostgreSQL.

### [Claim CLI](packages/claim-cli)

A command-line tool to claim LSK token by submitting transaction directly on-chain.

## Setup and Installation

The Node version for this project is 18. Make sure you have the correct version installed. If you are using `nvm`, run `nvm use 18`.

### 1. Clone Lisk Token Claim Repository

```
$ git clone git@github.com:LiskHQ/lisk-token-claim.git
```

### 2. Install Node dependencies and build project

```
$ yarn && yarn build
```

## Docker

Dockerfiles are stored at the [docker](./docker/) folder.
To build the docker locally,

```
docker build -t lisk-claim-backend -f ./docker/claim-backend/Dockerfile .
```

## Documentation

- [Tech Design](./documentation/Tech_Design.md) - A comprehensive document, including:

  - Project Background
  - Requirement of the project
  - Components of the project
  - Technical specification
  - Design

- [Taking Snapshot](./documentation/Taking_Snapshot.md) - A detailed documentation for:

  - Obtaining Lisk v4 Snapshot
  - Data preparation for Merkle Tree Generation
  - Generate Merkle Tree for
    - Lisk Token Migration
    - Migration Airdrop

- [Detailed Guide to Claim CLI Tool](./documentation/Detailed_Claim_CLI.md) - A detailed documentation for:
  - Claiming Lisk tokens without the need for UI
  - Detailed steps of the claim process using CLI

## Contributing

If you find any issues or have suggestions for improvements,
please [open an issue](https://github.com/LiskHQ/lisk-token-claim/issues/new/choose) on the GitHub repository. You can also
submit [pull requests](https://github.com/LiskHQ/lisk-token-claim/compare)
with [bug fixes](https://github.com/LiskHQ/lisk-token-claim/issues/new?assignees=&labels=bug+report&projects=&template=bug-report.md&title=%5BBug%5D%3A+),
[new features](https://github.com/LiskHQ/lisk-token-claim/issues/new?assignees=&labels=&projects=&template=feature-request.md),
or documentation enhancements.

## License

Copyright 2024 Onchain Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

```shell
    http://www.apache.org/licenses/LICENSE-2.0
```

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
