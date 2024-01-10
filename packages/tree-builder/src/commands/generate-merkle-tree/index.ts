import { Command, Flags } from '@oclif/core';
import * as path from 'path';
import { buildTreeJson } from '../../applications/generate-merkle-tree/build_tree_json';

export default class GenerateMerkleTree extends Command {
	static description = 'Generate Merkle Tree';

	static examples = [`$ oex generate-merkle-tree --network=testnet`];

	static flags = {
		network: Flags.string({
			options: ['example', 'testnet', 'mainnet'],
			description: 'Target network for Merkle Tree',
			required: true,
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(GenerateMerkleTree);
		const { network } = flags;

		const networkPath = path.join('../../data/', network);
		this.log(`Running at \x1b[42m${network}\x1b[0m`);

		buildTreeJson(networkPath);

		this.log(`Success running GenerateMerkleTree (network=${network})!`);
	}
}
