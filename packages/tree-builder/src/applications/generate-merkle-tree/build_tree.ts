import { address } from '@liskhq/lisk-cryptography';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ux } from '@oclif/core';
import { Account, Leaf } from '../../interface';
import { LEAF_ENCODING } from '../../constants';
import { append0x } from '../../utils';

export function createPayload(account: Account) {
	return [
		append0x(address.getAddressFromLisk32Address(account.lskAddress)),
		account.balanceBeddows,
		account.numberOfSignatures ?? 0,
		account.mandatoryKeys ? account.mandatoryKeys.map(key => append0x(key)) : [],
		account.optionalKeys ? account.optionalKeys.map(key => append0x(key)) : [],
	];
}

export function buildTree(accounts: Account[]): {
	tree: StandardMerkleTree<(string | number | Buffer | string[])[]>;
	leaves: Leaf[];
} {
	// Check that addresses are sorted
	for (const [index, account] of accounts.entries()) {
		// Last address, skip
		if (index === accounts.length - 1) {
			continue;
		}
		if (
			address
				.getAddressFromLisk32Address(account.lskAddress)
				.compare(address.getAddressFromLisk32Address(accounts[index + 1].lskAddress)) === 1
		) {
			throw new Error('Address not sorted! Please sort your addresses before continue');
		}
	}

	ux.log(`${accounts.length} Accounts to generate:`);

	const leaves: Leaf[] = [];
	const tree = StandardMerkleTree.of(
		accounts.map(account => {
			return createPayload(account);
		}),
		LEAF_ENCODING,
	);

	for (const account of accounts) {
		const addressHex = address.getAddressFromLisk32Address(account.lskAddress);
		const payload = createPayload(account);

		leaves.push({
			lskAddress: account.lskAddress,
			address: append0x(addressHex.toString('hex')),
			balanceBeddows: account.balanceBeddows,
			numberOfSignatures: account.numberOfSignatures ?? 0,
			mandatoryKeys: account.mandatoryKeys
				? account.mandatoryKeys.map((key: string) => append0x(key))
				: [],
			optionalKeys: account.optionalKeys
				? account.optionalKeys.map((key: string) => append0x(key))
				: [],
			hash: tree.leafHash(payload),
			proof: tree.getProof(payload),
		});
	}

	return {
		tree,
		leaves,
	};
}
