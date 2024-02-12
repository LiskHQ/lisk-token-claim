FROM node:18-alpine as base

WORKDIR /opt/build

# Copy files
COPY . .

RUN ls -al

# Install dependencies
RUN yarn install

# Build the TypeScript code
RUN yarn build

# Runner container
FROM base

WORKDIR /usr/token-claim

COPY --from=0 /opt/build ./

WORKDIR /usr/token-claim/packages/claim-backend

EXPOSE 3000

CMD ["yarn", "server"]