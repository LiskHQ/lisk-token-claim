import { Command, Flags } from '@oclif/core';
import { buildTreeJSON } from '../../applications/buildTreeJSON';

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

		const path = `../../data/${network}`;
		this.log(`Running at \x1b[42m${network}\x1b[0m`);

		buildTreeJSON(path);

		this.log(`Success running GenerateMerkleTree (network=${network})!`);
	}
}
