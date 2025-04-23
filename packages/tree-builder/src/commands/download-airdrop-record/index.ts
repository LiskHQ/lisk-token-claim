import * as path from 'path';
import { promises as fs } from 'fs';
import { Command, Flags } from '@oclif/core';
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client/core';
import { ApolloLink } from '@apollo/client/link/core';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const query = `
query GetAirdropClaimeds($first: Int!, $skip: Int!) {
  airdropClaimeds(first: $first, skip: $skip) {
    id
    lskAddress
    recipient
    amount
  }
}
`;

export default class DownloadAirdropRecord extends Command {
	static description = 'Fetch all airdrop record from Goldsky subgraph, and output as JSON file.';

	static examples = [
		`$ oex download-airdrop-record --claiming-subgraph-url https://api.goldsky.com/api/xxxxx/1.0.0/gn --subgraph-token yyyyyy --output-path ./data`,
	];

	static flags = {
		'claiming-subgraph-url': Flags.string({
			description: 'URL for Claiming Subgraph in Goldsky',
			required: true,
		}),
		'subgraph-token': Flags.string({
			description: 'API Token of Goldsky',
			default: path.join(process.cwd(), 'data'),
		}),
		'output-path': Flags.string({
			description: 'Destination path of the JSON file',
			default: path.join(process.cwd(), 'data'),
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(DownloadAirdropRecord);
		const {
			'claiming-subgraph-url': subgraphUrl,
			'subgraph-token': subgraphToken,
			'output-path': outputPath,
		} = flags;
		this.log(`Reading: ${subgraphUrl} with ${subgraphToken.substring(0, 4)}...`);

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

		const airdropClaims: {
			ID: string;
			lskAddress: string;
			recipient: string;
			amount: string;
		}[] = [];

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
				this.log('Error fetching data from Subgraph:', error);
				process.exit(1);
			}

			offset += pageSize;
			this.log(
				`Fetching ${fetched.length} entities from Subgraph, total entities: ${airdropClaims.length} ...`,
			);
		} while (fetched.length > 0);

		const userClaimedAmounts: {
			[lskAddress: string]: bigint;
		} = {};

		for (const claim of airdropClaims) {
			if (!userClaimedAmounts[claim.recipient]) {
				userClaimedAmounts[claim.recipient] = BigInt(0);
			}
			userClaimedAmounts[claim.recipient] += BigInt(claim.amount);
		}

		const airdropClaimJSONPath = path.join(outputPath, 'airdropClaimed.json');
		await fs.writeFile(
			airdropClaimJSONPath,
			JSON.stringify(
				userClaimedAmounts,
				(_, value) => (typeof value === 'bigint' ? value.toString() : value),
				4,
			),
			'utf-8',
		);

		this.log(`${airdropClaims.length} entities fetched from Subgraph.`);
		this.log(`${Object.keys(userClaimedAmounts).length} unique users.`);
		this.log('Airdrop Record outputted to:', airdropClaimJSONPath);
	}
}
