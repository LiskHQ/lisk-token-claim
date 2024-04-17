import { expect } from 'chai';
import { applyAirdrop } from '../../src/applications/generate-airdrop-merkle-tree';
import { Account } from '../../src/interface';
import { lskToBeddows } from '../../src/utils';

const findAccountByAddress = (accounts: Account[], address: string) => {
	const account = accounts.find(account => account.lskAddress === address);
	if (!account) {
		throw 'Account Not Found';
	}
	return account;
};

describe('generateAirdropMerkleTree', () => {
	describe('applyAirdrop', () => {
		it('should apply airdrop rules', () => {
			const cutOff = lskToBeddows(50);
			const whaleCap = lskToBeddows(250000);
			const airdropPercent = BigInt(10);
			const excludedAddresses = ['address-excluded'];

			const accounts = [
				{
					lskAddress: 'address0',
					balanceBeddows: cutOff.toString(),
				},
				{
					lskAddress: 'address-below-cutoff',
					balanceBeddows: (cutOff - 1n).toString(),
				},
				{
					lskAddress: 'address1',
					balanceBeddows: lskToBeddows(123).toString(),
				},
				{
					lskAddress: 'address-above-whale-cap',
					balanceBeddows: (whaleCap + 1n).toString(),
				},
				{
					lskAddress: 'address-excluded',
					balanceBeddows: lskToBeddows(456).toString(),
				},
				{
					lskAddress: 'address2',
					balanceBeddows: whaleCap.toString(),
				},
			] as Account[];

			const accountsAfterApplyAirdrop = applyAirdrop(
				accounts,
				cutOff,
				whaleCap,
				airdropPercent,
				excludedAddresses,
			);

			// Expect `address-below-cutoff` and `address-excluded` removed
			expect(accountsAfterApplyAirdrop.length).to.eq(accounts.length - 2);

			// Expect `address-above-whale-cap` being capped at (whale-cap * percent / 100)
			expect(
				findAccountByAddress(accountsAfterApplyAirdrop, 'address-above-whale-cap').balanceBeddows,
			).to.eq(((whaleCap * airdropPercent) / BigInt(100)).toString());

			// Expect other balances = balance * percent / 100
			for (const address of ['address0', 'address1', 'address2']) {
				expect(findAccountByAddress(accountsAfterApplyAirdrop, address).balanceBeddows).to.eq(
					(
						(BigInt(findAccountByAddress(accounts, address).balanceBeddows) * airdropPercent) /
						100n
					).toString(),
				);
			}
		});
	});
});
