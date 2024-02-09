# Lisk Token Claim <!-- omit in toc -->

This repository is a monorepo for essential non-contract services for Token Claim.

## Table of Contents <!-- omit in toc -->

- [Repositories](#repositories)
  - [Tree Builder](#tree-builder)
  - [Token Claim Backend](#claim-backend)
- [Setup and Installation](#setup-and-installation)
- [Contributing](#contributing)
- [License](#license)

## Repositories

In this monorepo there are currently 2 repositories:

### [Tree Builder](packages/tree-builder)

Builds Merkle Tree from a snapshot and computes Merkle Root.

### [Claim Backend](packages/claim-backend)

Perform as a backend server, compatible with JSON RPC 2.0 Standard.

The database is using PostgreSQL

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

## Contributing

If you find any issues or have suggestions for improvements,
please [open an issue](https://github.com/LiskHQ//lisk-token-claim/issues/new/choose) on the GitHub repository. You can also
submit [pull requests](https://github.com/LiskHQ//lisk-token-claim/compare)
with [bug fixes](https://github.com/LiskHQ//lisk-token-claim/issues/new?assignees=&labels=bug+report&projects=&template=bug-report.md&title=%5BBug%5D%3A+),
[new features](https://github.com/LiskHQ//lisk-token-claim/issues/new?assignees=&labels=&projects=&template=feature-request.md),
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
