import { Network } from '../utils/network';
import { Account, CheckEligibilityResponse } from '../interfaces';
import { ethers } from 'ethers';
import L2ClaimAbi from '../abi/L2Claim';

export interface AccountListChoice {
	name: string;
	value: Account;
	disabled?: string;
}

export default async function buildAccountList(
	result: CheckEligibilityResponse,
	networkParams: Network,
): Promise<AccountListChoice[]> {
	const numOfSigned = result.signatures.reduce(
		(acc: { [destination: string]: number }, signature) => {
			if (!acc[signature.lskAddress]) {
				acc[signature.lskAddress] = 0;
			}
			acc[signature.lskAddress]++;
			return acc;
		},
		{},
	);

	const accountList: AccountListChoice[] = [
		{
			name: `${result.account.lskAddress} (${ethers.formatUnits(result.account.balanceBeddows, 8)} LSK)`,
			value: result.account,
		},
	].concat(
		result.multisigAccounts.map(account => ({
			name: `${account.lskAddress} [${numOfSigned[account.lskAddress] ?? 0}/${account.numberOfSignatures}] (${ethers.formatUnits(account.balanceBeddows, 8)} LSK)`,
			value: account,
		})),
	);

	const claimContract = new ethers.Contract(
		networkParams.l2Claim,
		L2ClaimAbi,
		new ethers.JsonRpcProvider(networkParams.rpc),
	);

	for (const account of accountList) {
		const claimedTo = await claimContract.claimedTo(account.value.address);
		if (claimedTo !== ethers.ZeroAddress) {
			account.disabled = `Already Claimed To: ${claimedTo}`;
		}
	}

	return accountList;
}
