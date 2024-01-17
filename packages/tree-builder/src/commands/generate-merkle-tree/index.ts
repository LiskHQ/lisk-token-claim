import { Command, Flags } from '@oclif/core';
import * as path from 'path';
import { buildTreeJson } from '../../applications/generate-merkle-tree/build_tree_json';
import * as fs from "fs";
import {createSnapshot} from "../../applications/generate-merkle-tree/create_snapshot";

export default class GenerateMerkleTree extends Command {
	static description = 'Generate Merkle Tree';

	static examples = [`$ oex generate-merkle-tree --network=testnet`];

	static flags = {
		network: Flags.string({
			options: ['example', 'testnet', 'mainnet'],
			description: 'Target network for Merkle Tree',
			required: true,
		}),
		dbPath: Flags.string({
			description: 'Database path, which your state.db is located',
			required: true,
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(GenerateMerkleTree);
		const { network, dbPath } = flags;

		const networkPath = path.join('../../data/', network);
		this.log(`Running at \x1b[42m${network}\x1b[0m`);
		this.log("DB Path", dbPath);

		const stateDbPath = path.join(dbPath, "state.db");

		if (!fs.existsSync(stateDbPath)) {
			throw new Error(`${stateDbPath} does not exist`);
		}

		const accounts = await createSnapshot(stateDbPath);
		await buildTreeJson(networkPath, accounts);

		this.log(`Success running GenerateMerkleTree (network=${network})!`);
	}
}
