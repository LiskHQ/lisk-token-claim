import * as path from 'path';
import { promises as fs } from 'fs';
import { Command, Flags } from '@oclif/core';
import { HodlerdropAccount } from '../../interface';
import { buildAirdropTreeJson } from '../../applications/generate-hodlerdrop-merkle-tree/build_airdrop_tree_json';

export default class GenerateHodlerdropMerkleTree extends Command {
	static description =
		'Generate a Merkle tree for the Hodlerdrop based on claimed airdrop records and ratio of unclaimed amount';

	static examples = [
		`$ oex generate-hodlerdrop-merkle-tree --airdrop-amount 3000000000000000000000000 --unclaimed-amount 1375134441061135000000000 --json-path ./data --output-path ./data`,
	];

	static flags = {
		'airdrop-amount': Flags.string({
			description: 'The total amount of LSK tokens to be given away in the migration airdrop',
			required: true,
		}),
		'unclaimed-amount': Flags.string({
			description: 'The total amount of LSK tokens still unclaimed',
			required: true,
		}),
		'json-path': Flags.string({
			description: 'Location of airdropClaimed.json generated from download-airdrop-record command',
			default: path.join(process.cwd(), 'data'),
		}),
		'output-path': Flags.string({
			description: 'Destination path of the JSON file',
			default: path.join(process.cwd(), 'data'),
		}),
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(GenerateHodlerdropMerkleTree);
		const {
			'json-path': jsonPath,
			'airdrop-amount': airdropAmount,
			'unclaimed-amount': unclaimedAmount,
			'output-path': outputPath,
		} = flags;

		const airdropClaimedJSONPath = path.join(jsonPath, 'airdropClaimed.json');
		this.log(`Reading: ${airdropClaimedJSONPath} ...`);

		await fs.access(airdropClaimedJSONPath);
		const airdropClaimedAccounts = JSON.parse(
			await fs.readFile(airdropClaimedJSONPath, 'utf-8'),
		) as HodlerdropAccount[];

		await buildAirdropTreeJson(
			outputPath,
			airdropClaimedAccounts,
			BigInt(airdropAmount),
			BigInt(unclaimedAmount),
		);
	}
}
