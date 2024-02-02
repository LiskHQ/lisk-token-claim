import * as path from 'path';
import * as fs from 'fs';
import { Command, Flags } from '@oclif/core';
import { StateDB } from '@liskhq/lisk-db';
import { buildTreeJson } from '../../applications/generate-merkle-tree/build_tree_json';
import { createSnapshot } from '../../applications/generate-merkle-tree/create_snapshot';

export default class GenerateMerkleTree extends Command {
	static description = 'Generate Merkle Tree from blockchain data';

	static examples = [`$ oex generate-merkle-tree --db-path=/User/.lisk/lisk-core/data`];

	static flags = {
		'db-path': Flags.string({
			description: 'Database path, where your state.db is located',
			required: true,
		}),
		outputPath: Flags.string({
			description: 'Destination path of the merkle tree',
			default: path.join(process.cwd(), 'data'),
		}),
		tokenId: Flags.string({
			description: 'Token ID, use default for mainnet LSK Token',
			parse: async (input: string) => {
				if (input.length !== 16) {
					throw new Error('tokenId length be in 8 bytes');
				}
				return input;
			},
			default: '0000000000000000',
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(GenerateMerkleTree);
		const { 'db-path': dbPath, tokenId, outputPath } = flags;

		const stateDbPath = path.join(dbPath, 'state.db');
		this.log(`Reading: ${stateDbPath} ...`);

		if (!fs.existsSync(stateDbPath)) {
			throw new Error(`${stateDbPath} does not exist`);
		}

		const rdb = new StateDB(stateDbPath, { readonly: true });
		const accounts = await createSnapshot(rdb, Buffer.from(tokenId, 'hex'));
		if (accounts.length === 0) {
			this.log('DB has 0 accounts, check tokenId or local chain status');
			return;
		}
		await buildTreeJson(outputPath, accounts);

		const accountJSONPath = path.join(outputPath, 'accounts.json');
		fs.writeFileSync(accountJSONPath, JSON.stringify(accounts), 'utf-8');
		this.log('Account snapshot outputted to:', accountJSONPath);

		this.log(`Success running GenerateMerkleTree`);
		rdb.close();
	}
}
