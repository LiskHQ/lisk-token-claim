FROM node:18-alpine as base

WORKDIR /opt/build

# Copy files
COPY . .

# Install dependencies
RUN yarn install

# Build the TypeScript code
RUN yarn build

# Runner container
FROM base

WORKDIR /usr/token-claim

COPY --from=0 /opt/build ./

ENV MERKLE_TREE_PATH=/usr/token-claim/data/token-claim/claim/merkle-tree-result-detailed.json
ENV AIRDROP_MERKLE_TREE_PATH=/usr/token-claim/data/token-claim/airdrop/merkle-tree-result-detailed.json

WORKDIR /usr/token-claim/packages/claim-backend


EXPOSE 3000

CMD ["yarn", "server"]