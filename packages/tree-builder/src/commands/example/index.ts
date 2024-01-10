import { Args, Command } from '@oclif/core';
import { createAccounts } from '../../applications/example/create_accounts';
import { signAccounts } from '../../applications/example/sign_accounts';
import { buildTreeJson } from '../../applications/generate-merkle-tree/build_tree_json';
import { createKeyPairs } from '../../applications/example/create_key_pairs';

export default class Example extends Command {
	static args = {
		amountOfLeaves: Args.integer({
			description: 'Amount of leaves in the tree',
			required: false,
			default: 100,
		}),
		recipient: Args.string({
			description:
				'Destination address at signing stage. Default is the contract address created by default mnemonic in Anvil/Ganache when nonce=0',
			required: false,
			default: '0x34A1D3fff3958843C43aD80F30b94c510645C316',
		}),
	};

	static description = 'Generate example data for demo purpose';

	static examples = [`$ oex generate`];

	async run(): Promise<void> {
		const { args } = await this.parse(Example);

		// Create key-pairs.json
		await createKeyPairs(args.amountOfLeaves);

		// Create Accounts using key-pairs.json with random balances
		createAccounts(args.amountOfLeaves);

		// Build MerkleTree to example
		buildTreeJson(`../../data/example`);

		// Sign all leaves using key-pairs.json
		signAccounts(args.recipient);

		this.log('Success running example!');
	}
}
