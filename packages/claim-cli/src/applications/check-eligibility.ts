import { input } from '@inquirer/prompts';
import { Network } from '../utils/network';
import buildAccountList from '../utils/build-account-list';
import { fetchCheckEligibility } from '../utils/endpoint';

export default async function checkEligibility(networkParams: Network) {
	const lskAddress = await input({ message: 'Your LSK Address' });

	const result = await fetchCheckEligibility(lskAddress, networkParams);
	if (!result.account && result.multisigAccounts.length === 0) {
		console.log(`No Eligible Claim for Address: ${lskAddress}`);
		process.exit(1);
	}

	const accountList = await buildAccountList(result, networkParams);

	console.log('Claimed:');
	for (const [index, account] of accountList.entries()) {
		if (account.disabled) {
			console.log(`${index + 1}: ${account.name} ${account.disabled}`);
		}
	}

	console.log('Eligible Claims:');
	for (const [index, account] of accountList.entries()) {
		if (!account.disabled) {
			console.log(`${index + 1}: ${account.name}}`);
		}
	}
}
