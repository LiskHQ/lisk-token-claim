import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import { Flags, Command } from '@oclif/core';
import { createAccounts } from '../../applications/example/create_accounts';
import { signAccounts } from '../../applications/example/sign_accounts';
import { buildTreeJson } from '../../applications/generate-merkle-tree/build_tree_json';
import { createKeyPairs } from '../../applications/example/create_key_pairs';
import { Account, AirdropClaimedAccount } from '../../interface';
import { buildHodlerdropTreeJson } from '../../applications/generate-hodlerdrop-merkle-tree/build_hodlerdrop_tree_json';

export default class Example extends Command {
	static flags = {
		amountOfLeaves: Flags.integer({
			description: 'Amount of leaves in the tree',
			required: false,
			default: 100,
		}),
		recipient: Flags.string({
			description:
				'Destination address at signing stage. Default is the contract address created by default mnemonic in Anvil/Ganache when nonce=0',
			required: false,
			default: '0x34A1D3fff3958843C43aD80F30b94c510645C316',
		}),
		'hodlerdrop-mnemonic': Flags.string({
			description:
				'Mnemonic used for generating Hodlerdrop V2. Default is the default mnemonic used by Anvil/Ganache',
			required: false,
			default:
				'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
		}),
	};

	static description = 'Generate example data for demo purpose';

	static examples = [`$ oex example`];

	async run(): Promise<void> {
		const { flags } = await this.parse(Example);
		const exampleDataPath = '../../data/example';

		// Create key-pairs.json
		await createKeyPairs(flags.amountOfLeaves);

		// Create Accounts using key-pairs.json with random balances
		createAccounts(flags.amountOfLeaves);

		const accountPath = path.join(exampleDataPath, 'accounts.json');
		this.log('Sample accounts outputted to:', accountPath);

		const accounts = JSON.parse(await fs.promises.readFile(accountPath, 'utf-8')) as Account[];

		// Build MerkleTree to example
		await buildTreeJson(exampleDataPath, accounts);

		// Sign all leaves using key-pairs.json
		signAccounts(flags.recipient);

		// Create Accounts for Hodlerdrop
		const hdNodeWallet = ethers.HDNodeWallet.fromPhrase(
			flags['hodlerdrop-mnemonic'],
			'',
			"m/44'/60'/0'/0",
		);
		const hodlerdropAddresses: AirdropClaimedAccount[] = [];
		for (let i = 0; i < flags.amountOfLeaves; i++) {
			const wallet = hdNodeWallet.derivePath(i.toString());

			hodlerdropAddresses.push({
				address: wallet.address,
				claimedAmountWei: ethers.parseUnits((Math.random() * 100).toString(), 'ether').toString(),
			});
		}

		await buildHodlerdropTreeJson(
			exampleDataPath,
			hodlerdropAddresses.sort((a, b) => (a.address > b.address ? 1 : -1)),
			ethers.parseUnits('3000000', 'ether'),
			ethers.parseUnits('1000000', 'ether'),
		);
		this.log('Success running example!');
	}
}
