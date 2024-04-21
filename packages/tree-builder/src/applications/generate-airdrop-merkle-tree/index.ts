import { Account, AirdropAccount } from '../../interface';
import { beddowsToWei } from '../../utils';

export const applyAirdrop = (
	accounts: Account[],
	cutOff: bigint,
	whaleCap: bigint,
	percent: bigint,
	excludedAddresses: string[] = [],
): AirdropAccount[] => {
	return accounts.reduce((acc: AirdropAccount[], account: Account) => {
		const balanceBeddows = BigInt(account.balanceBeddows);
		if (balanceBeddows < cutOff) {
			return acc;
		}
		if (excludedAddresses.indexOf(account.lskAddress) >= 0) {
			return acc;
		}
		const newBalanceBeddows = balanceBeddows > whaleCap ? whaleCap : balanceBeddows;

		acc.push({
			lskAddress: account.lskAddress,
			balanceWei: beddowsToWei((newBalanceBeddows * percent) / BigInt(100)).toString(),
		});
		return acc;
	}, []);
};
