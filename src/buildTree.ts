import { cryptography } from 'lisk-sdk';
import { Account, Leaf } from './interface';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { LEAF_ENCODING } from './constants';

export const createPayload = (account: Account) => {
	return [
		cryptography.address.getAddressFromLisk32Address(account.lskAddress),
		account.balanceBeddows,
		account.numberOfSignatures ?? 0,
		account.mandatoryKeys ? account.mandatoryKeys.map(key => '0x' + key) : [],
		account.optionalKeys ? account.optionalKeys.map(key => '0x' + key) : [],
	];
};

export const buildTree = (
	accounts: Account[],
): {
	tree: StandardMerkleTree<any>;
	leaves: Leaf[];
} => {
	// Check that addresses are sorted
	for (const [index, account] of accounts.entries()) {
		// Last address, skip
		if (index === accounts.length - 1) {
			continue;
		}
		if (
			cryptography.address
				.getAddressFromLisk32Address(account.lskAddress)
				.compare(
					cryptography.address.getAddressFromLisk32Address(accounts[index + 1].lskAddress),
				) === 1
		) {
			throw new Error('Address not sorted! Please sort your addresses before continue');
		}
	}

	console.log(`${accounts.length} Accounts to generate:`);

	const leaves: Leaf[] = [];
	const tree = StandardMerkleTree.of(
		accounts.map(account => {
			return createPayload(account);
		}),
		LEAF_ENCODING,
	);

	for (const account of accounts) {
		const address = cryptography.address.getAddressFromLisk32Address(account.lskAddress);
		const payload = createPayload(account);

		console.log(
			`${account.lskAddress}: ${account.balance} LSK (Multisig=${
				account.numberOfSignatures && account.numberOfSignatures > 0 ? 'Y' : 'N'
			})`,
		);

		leaves.push({
			lskAddress: account.lskAddress,
			address: '0x' + address.toString('hex'),
			balance: account.balance,
			balanceBeddows: account.balanceBeddows,
			numberOfSignatures: account.numberOfSignatures ?? 0,
			mandatoryKeys: account.mandatoryKeys
				? account.mandatoryKeys.map((key: string) => '0x' + key)
				: [],
			optionalKeys: account.optionalKeys
				? account.optionalKeys.map((key: string) => '0x' + key)
				: [],
			hash: tree.leafHash(payload),
			proof: tree.getProof(payload),
		});
	}

	return {
		tree,
		leaves,
	};
};
