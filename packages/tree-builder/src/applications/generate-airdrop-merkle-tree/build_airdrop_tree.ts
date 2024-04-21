import { address } from '@liskhq/lisk-cryptography';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ux } from '@oclif/core';
import { AirdropAccount, AirdropLeaf } from '../../interface';
import { AIRDROP_LEAF_ENCODING } from '../../constants';
import { append0x } from '../../utils';

export function createPayload(account: AirdropAccount) {
	return [append0x(address.getAddressFromLisk32Address(account.lskAddress)), account.balanceWei];
}

export function buildAirdropTree(accounts: AirdropAccount[]): {
	tree: StandardMerkleTree<(string | number | Buffer | string[])[]>;
	leaves: AirdropLeaf[];
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

	const leaves: AirdropLeaf[] = [];
	const tree = StandardMerkleTree.of(
		accounts.map(account => {
			return createPayload(account);
		}),
		AIRDROP_LEAF_ENCODING,
	);

	for (const account of accounts) {
		const addressHex = address.getAddressFromLisk32Address(account.lskAddress);
		const payload = createPayload(account);

		leaves.push({
			lskAddress: account.lskAddress,
			address: append0x(addressHex.toString('hex')),
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
