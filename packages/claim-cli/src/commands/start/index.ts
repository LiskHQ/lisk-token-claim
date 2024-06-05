import { Flags, Command } from '@oclif/core';
import { select } from '@inquirer/prompts';
import checkEligibility from '../../applications/check-eligibility';
import submitClaim from '../../applications/submit-claim';
import publishMultisigClaim from '../../applications/publish-multisig-claim';
import { Local, Mainnet, Testnet } from '../../utils/network';

enum Choice {
	CHECK_ELIGIBILITY,
	SUBMIT_CLAIM,
	SUBMIT_MULTISIG_CLAIM,
}

export default class Start extends Command {
	static flags = {
		network: Flags.string({
			description:
				'Destination address at signing stage. Default is the contract address created by default mnemonic in Anvil/Ganache when nonce=0',
			required: false,
			default: 'mainnet',
			options: ['mainnet', 'testnet', 'local'],
		}),
	};

	static description = 'Generate example data for demo purpose';

	static examples = [`$ oex example`];

	async run(): Promise<void> {
		const { flags } = await this.parse(Start);
		const { network } = flags;

		console.log(`Welcome to Lisk Claim CLI (Running on "${network}" Network)`);
		const answer = await select({
			message: 'Please enter your choices',
			choices: [
				{ name: 'Check my Eligibility', value: Choice.CHECK_ELIGIBILITY },
				{ name: 'Submit a Claim', value: Choice.SUBMIT_CLAIM },
				{
					name: 'Publish a Multisig claim with completed signatures onchain',
					value: Choice.SUBMIT_MULTISIG_CLAIM,
				},
			],
		});

		const networkParams = {
			mainnet: Mainnet,
			testnet: Testnet,
			local: Local,
		}[network as 'mainnet' | 'testnet' | 'local'];
		await [checkEligibility, submitClaim, publishMultisigClaim][answer](networkParams);
	}
}
