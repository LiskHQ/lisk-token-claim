import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ux } from '@oclif/core';
import { AirdropClaimedAccount, HodlerdropAccount, HodlerdropLeaf } from '../../interface';
import { HODLERDROP_LEAF_ENCODING } from '../../constants';

export function applyClaimMultiplier(
	userAmount: bigint,
	airdropAmount: bigint,
	unclaimedAmount: bigint,
): bigint {
	return (userAmount * unclaimedAmount) / (airdropAmount - unclaimedAmount);
}

export function createPayload(account: HodlerdropAccount) {
	return [account.address, account.balanceWei];
}

export function buildAirdropTree(
	accounts: AirdropClaimedAccount[],
	airdropAmount: bigint,
	unclaimedAmount: bigint,
): {
	tree: StandardMerkleTree<(string | number | Buffer | string[])[]>;
	leaves: HodlerdropLeaf[];
} {
	// Check that addresses are sorted
	for (const [index, account] of accounts.entries()) {
		// Last address, skip
		if (index === accounts.length - 1) {
			continue;
		}
		if (account.address > accounts[index + 1].address) {
			throw new Error('Address not sorted! Please sort your addresses before continue');
		}
	}

	ux.log(`${accounts.length} Accounts to generate:`);
	ux.log(
		`Claim multiplier: ${(Number(unclaimedAmount) / Number(airdropAmount - unclaimedAmount)).toFixed(4)}x`,
	);
	const appliedMultiplierAccounts: HodlerdropAccount[] = accounts.map(account => ({
		...account,
		balanceWei: applyClaimMultiplier(
			BigInt(account.claimedAmountWei),
			airdropAmount,
			unclaimedAmount,
		).toString(),
	}));

	const leaves: HodlerdropLeaf[] = [];
	const tree = StandardMerkleTree.of(
		appliedMultiplierAccounts.map(account => createPayload(account)),
		HODLERDROP_LEAF_ENCODING,
	);

	for (const account of appliedMultiplierAccounts) {
		const payload = createPayload(account);

		leaves.push({
			address: account.address,
			claimedAmountWei: account.claimedAmountWei,
			balanceWei: account.balanceWei,
			hash: tree.leafHash(payload),
			proof: tree.getProof(payload),
		});
	}

	return {
		tree,
		leaves,
	};
}
