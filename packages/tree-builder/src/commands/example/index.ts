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

		// Create keyPairs.json
		await createKeyPairs(args.amountOfLeaves);

		// Create Accounts using keyPairs.json with random balances
		createAccounts(args.amountOfLeaves);

		// Build MerkleTree to example
		buildTreeJSON(`../../data/example`);

		// Sign all leaves using keyPairs.json
		signAccounts(args.recipient);

		this.log('Success running example!');
	}
}
