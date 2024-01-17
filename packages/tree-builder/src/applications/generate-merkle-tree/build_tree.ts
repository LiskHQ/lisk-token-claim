import { address } from '@liskhq/lisk-cryptography';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { Account, Leaf } from '../../interface';
import { LEAF_ENCODING } from '../../constants';
import { append0x } from '../../utils';
import { debug, log } from 'oclif/lib/log';

export function createPayload(account: Account) {
	return [
		address.getAddressFromLisk32Address(account.lskAddress),
		account.balanceBeddows,
		account.numberOfSignatures ?? 0,
		account.mandatoryKeys ? account.mandatoryKeys.map(key => append0x(key)) : [],
		account.optionalKeys ? account.optionalKeys.map(key => append0x(key)) : [],
	];
}

export function build_tree(accounts: Account[]): {
	tree: StandardMerkleTree<(number | Buffer | string[])[]>;
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

	log(`${accounts.length} Accounts to generate:`);

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

		debug(
			`${account.lskAddress}: ${account.balance} LSK (Multisig=${
				account.numberOfSignatures && account.numberOfSignatures > 0 ? 'Y' : 'N'
			})`,
		);

		leaves.push({
			lskAddress: account.lskAddress,
			address: append0x(addressHex.toString('hex')),
			balance: account.balance,
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

	debug('===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====');

	return {
		tree,
		leaves,
	};
}
