import { input } from '@inquirer/prompts';
import { Network } from '../utils/network';
import buildAccountList, { AccountListChoice } from '../utils/build-account-list';
import { fetchCheckEligibility } from '../utils/endpoint';

export default async function checkEligibility(networkParams: Network) {
	const lskAddress = await input({ message: 'Your LSK Address' });

	const result = await fetchCheckEligibility(lskAddress, networkParams);
	if (!result.account && result.multisigAccounts.length === 0) {
		console.log(`No Eligible Claim for Address: ${lskAddress}.`);
		process.exit(1);
	}

	const accountList = await buildAccountList(result, networkParams);

	const accountGroupedByClaimStatus = accountList.reduce(
		(
			acc: {
				claimed: AccountListChoice[];
				unclaimed: AccountListChoice[];
			},
			account,
		) => {
			if (account.claimed) {
				acc.claimed.push(account);
			} else {
				acc.unclaimed.push(account);
			}
			return acc;
		},
		{
			claimed: [],
			unclaimed: [],
		},
	);

	console.log(`> Claimed Addresses (${accountGroupedByClaimStatus.claimed.length}):`);
	for (const [index, account] of accountGroupedByClaimStatus.claimed.entries()) {
		console.log(`> ${index + 1}: ${account.name} ${account.claimed}`);
	}

	console.log('> ==========');

	console.log(`> Eligible Claims (${accountGroupedByClaimStatus.unclaimed.length}):`);
	for (const [index, account] of accountGroupedByClaimStatus.unclaimed.entries()) {
		console.log(`${index + 1}: ${account.name}`);
	}
}
