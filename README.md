# lisk-token-claim

This library is the monorepo for:

### Tree Builder

Builds Merkle Tree from a snapshot and computes Merkle Root.

### Token Claim Backend

Perform as a backend server, compatible with JSON RPC 2.0 Standard.

The database is using PostgreSQL

## Setup and Installation

```
$ yarn && yarn build
```

## Docker

Dockerfiles are stored at the [docker](./docker/) folder.
To build the docker locally,

```
docker build -t lisk-claim-backend -f ./docker/claim-backend/Dockerfile .
```
