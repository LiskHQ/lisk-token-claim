import * as path from 'path';

import { Command, Flags } from '@oclif/core';
import { downloadRecord } from '../../applications/download-airdrop-record/download_record';

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
			required: true,
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

		await downloadRecord(subgraphUrl, subgraphToken, outputPath);
	}
}
