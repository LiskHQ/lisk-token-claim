import {
	NetworkParams,
	buildAccountList,
	AccountListChoice,
	fetchCheckEligibility,
	getInput,
} from '../utils/';

export default async function checkEligibility(networkParams: NetworkParams): Promise<void> {
	const lskAddress = await getInput({ message: 'Your LSK Address' });

	const result = await fetchCheckEligibility(lskAddress, networkParams);
	if (!result.account && result.multisigAccounts.length === 0) {
		console.log(`No Eligible Claim for Address: ${lskAddress}.`);
		return process.exit(1);
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
			account.claimed ? acc.claimed.push(account) : acc.unclaimed.push(account);
			return acc;
		},
		{
			claimed: [],
			unclaimed: [],
		},
	);

	console.log(`Claimed Addresses (${accountGroupedByClaimStatus.claimed.length}):`);
	for (const [index, account] of accountGroupedByClaimStatus.claimed.entries()) {
		console.log(`${index + 1}: ${account.name} ${account.claimed}`);
	}

	console.log('==========');

	console.log(`Eligible Claims (${accountGroupedByClaimStatus.unclaimed.length}):`);
	for (const [index, account] of accountGroupedByClaimStatus.unclaimed.entries()) {
		console.log(`${index + 1}: ${account.name}`);
	}
}
