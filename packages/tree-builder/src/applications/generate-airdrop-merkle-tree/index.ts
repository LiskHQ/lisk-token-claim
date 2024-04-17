import { Account } from '../../interface';

export const applyAirdrop = (
	accounts: Account[],
	cutOff: bigint,
	whaleCap: bigint,
	percent: bigint,
	excludedAddresses: string[] = [],
): Account[] => {
	return accounts.reduce((acc: Account[], account: Account) => {
		const balanceBeddows = BigInt(account.balanceBeddows);
		if (balanceBeddows < cutOff) {
			return acc;
		}
		if (excludedAddresses.indexOf(account.lskAddress) >= 0) {
			return acc;
		}
		const newBalanceBeddows = balanceBeddows > whaleCap ? whaleCap : balanceBeddows;

		acc.push({
			...account,
			balanceBeddows: ((newBalanceBeddows * percent) / BigInt(100)).toString(),
		});
		return acc;
	}, []);
};
