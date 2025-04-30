import path from 'path';
import { promises as fs } from 'fs';
import { ux } from '@oclif/core';
import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client/core';
import { ApolloLink } from '@apollo/client/link/core';
import { AirdropClaimedAccount } from '../../interface';

interface GraphQLResponse {
	ID: string;
	recipient: string;
	amount: string;
}

const query = `
query GetAirdropClaimeds($first: Int!, $skip: Int!) {
  airdropClaimeds(first: $first, skip: $skip) {
    id
    recipient
    amount
  }
}
`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function consolidateRecords(airdropClaims: GraphQLResponse[]): AirdropClaimedAccount[] {
	const userClaimedAmountsGrouped: {
		[address: string]: bigint;
	} = {};

	for (const claim of airdropClaims) {
		if (!userClaimedAmountsGrouped[claim.recipient]) {
			userClaimedAmountsGrouped[claim.recipient] = BigInt(0);
		}
		userClaimedAmountsGrouped[claim.recipient] += BigInt(claim.amount);
	}

	return Object.entries(userClaimedAmountsGrouped)
		.map(([address, claimedAmount]) => ({
			address,
			claimedAmountWei: claimedAmount.toString(),
		}))
		.sort((a, b) => (a.address > b.address ? 1 : -1));
}

export async function downloadAirdropRecord(
	subgraphUrl: string,
	subgraphToken: string,
	outputPath: string,
) {
	const client = new ApolloClient({
		link: ApolloLink.from([
			new HttpLink({
				uri: subgraphUrl,
				headers: {
					Authorization: `Bearer ${subgraphToken}`,
				},
			}),
		]),
		cache: new InMemoryCache(),
	});

	const airdropClaims: GraphQLResponse[] = [];

	const pageSize = 100;
	let offset = 0;
	let fetched = [];
	do {
		try {
			const result = await client.query({
				query: gql(query),
				variables: {
					first: pageSize,
					skip: offset,
				},
			});

			fetched = result.data.airdropClaimeds;
			airdropClaims.push(...fetched);

			// Sleep for 2 seconds to avoid hitting the rate limit
			await sleep(2000);
		} catch (error) {
			if (error instanceof Error) {
				ux.log('Error fetching data from Subgraph:', error.message);
			}
			process.exit(1);
		}

		offset += pageSize;
		ux.log(
			`Fetching ${fetched.length} entities from Subgraph, total entities: ${airdropClaims.length} ...`,
		);
	} while (fetched.length > 0);

	const userClaimedAmountsSorted = consolidateRecords(airdropClaims);

	const airdropClaimJSONPath = path.join(outputPath, 'airdropClaimed.json');
	await fs.writeFile(
		airdropClaimJSONPath,
		JSON.stringify(userClaimedAmountsSorted, null, 4),
		'utf-8',
	);

	ux.log(`${airdropClaims.length} entities fetched from Subgraph.`);
	ux.log(`${userClaimedAmountsSorted.length} unique users.`);
	ux.log('Airdrop Record outputted to:', airdropClaimJSONPath);
}
