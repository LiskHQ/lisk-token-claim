import * as path from 'path';
import * as fs from 'fs';
import { Command, Flags } from '@oclif/core';
import { StateDB } from '@liskhq/lisk-db';
import { buildAirdropTreeJson } from '../../applications/generate-airdrop-merkle-tree/build_airdrop_tree_json';
import { createSnapshot } from '../../applications/generate-merkle-tree/create_snapshot';
import { applyAirdrop } from '../../applications/generate-airdrop-merkle-tree';
import { lskToBeddows, readExcludedAddresses } from '../../utils';

export default class GenerateAirdropMerkleTree extends Command {
	static description = 'Generate Airdrop Merkle Tree from blockchain data';

	static examples = [
		`$ oex generate-airdrop-merkle-tree --db-path=/User/.lisk/lisk-core/data --cutoff=50 --whale-cap=250000`,
	];

	static flags = {
		'db-path': Flags.string({
			description: 'Database path, where your state.db is located',
			required: true,
		}),
		'output-path': Flags.string({
			description: 'Destination path of the merkle tree',
			default: path.join(process.cwd(), 'data'),
		}),
		'token-id': Flags.string({
			description: 'Token ID, use default for mainnet LSK Token',
			parse: async (input: string) => {
				if (input.length !== 16) {
					throw new Error('token-id length be in 8 bytes');
				}
				return input;
			},
			default: '0000000000000000',
		}),
		cutoff: Flags.string({
			description: 'Minimal amount of LSK required to participate in the migration airdrop',
			default: '50',
		}),
		'whale-cap': Flags.string({
			description:
				'Cap on the LSK amount of a single Lisk v4 account to be used for the airdrop computation',
			default: '250000',
		}),
		'airdrop-percent': Flags.string({
			description:
				'The airdrop amount is equal to the given percentage of LSK balance, after whale cap and cutoff are applied',
			default: '10',
		}),
		'excluded-addresses-path': Flags.string({
			description: 'File Path of List of addresses excluded from airdrop',
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(GenerateAirdropMerkleTree);
		const {
			'db-path': dbPath,
			'token-id': tokenId,
			'output-path': outputPath,
			cutoff: cutOff,
			'whale-cap': whaleCap,
			'airdrop-percent': airdropPercent,
			'excluded-addresses-path': excludedAddressesPath,
		} = flags;

		const stateDbPath = path.join(dbPath, 'state.db');
		this.log(`Reading: ${stateDbPath} ...`);

		if (!fs.existsSync(stateDbPath)) {
			throw new Error(`${stateDbPath} does not exist`);
		}

		const rdb = new StateDB(stateDbPath, { readonly: true });
		try {
			const accounts = await createSnapshot(rdb, Buffer.from(tokenId, 'hex'));
			if (accounts.length === 0) {
				this.log('DB has 0 accounts, check token-id or local chain status');
				return;
			}

			// Apply Airdrop Rules
			const excludedAddresses = readExcludedAddresses(excludedAddressesPath);
			this.log(`Cutoff: ${cutOff} LSK`);
			this.log(`Whale Cap: ${whaleCap} LSK`);
			this.log(`Airdrop %: ${airdropPercent} %`);
			this.log(
				`${
					excludedAddresses.length
				} addresses to be excluded from airdrop: ${excludedAddresses.join(',')}`,
			);
			const airdropAccounts = applyAirdrop(
				accounts,
				lskToBeddows(cutOff),
				lskToBeddows(whaleCap),
				BigInt(airdropPercent),
				excludedAddresses,
			);

			await buildAirdropTreeJson(outputPath, airdropAccounts);

			const accountJSONPath = path.join(outputPath, 'accounts.json');
			fs.writeFileSync(accountJSONPath, JSON.stringify(airdropAccounts, null, 4), 'utf-8');
			this.log('Account snapshot outputted to:', accountJSONPath);
			this.log(`Success running GenerateAirdropMerkleTree`);
		} catch (err: unknown) {
			if (err instanceof Error) {
				this.log('Error Generating Airdrop Merkle Tree:', err.message);
			}
		} finally {
			rdb.close();
		}
	}
}
