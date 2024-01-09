import { Args, Command } from '@oclif/core';
import { createAccounts } from '../../applications/example/create-accounts';
import { signAccounts } from '../../applications/example/sign-accounts';
import { buildTreeJSON } from '../../applications/buildTreeJSON';
import { createKeyPairs } from '../../applications/example/create-key-pairs';

export default class Example extends Command {
	static args = {
		amountOfLeaves: Args.integer({
			description: 'Amount of leaves in the tree',
			required: false,
			default: 100,
		}),
	};

	static description = 'Generate example data for demo purpose';

	static examples = [`$ oex generate`];

	async run(): Promise<void> {
		const { args } = await this.parse(Example);

		// Create keyPairs.json
		await createKeyPairs(args.amountOfLeaves);

		// Create Accounts using keys.ts with random balances
		createAccounts(args.amountOfLeaves);

		// Build MerkleTree to example
		buildTreeJSON(`../../data/example`);

		// Sign all leaves using keys.ts again
		signAccounts();

		this.log('Success running example!');
	}
}
