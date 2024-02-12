import { Leaf } from '../interface';
import { address } from '@liskhq/lisk-cryptography';
import { remove0x } from './index';
import { fileExists, readJson } from './fs-helper';

const leafMap: {
	[lskAddress: string]: Leaf;
} = {};

const multisigMap: {
	[lskAddress: string]: Leaf[];
} = {};

export function getLeafMap(lskAddress: string): Leaf | null {
	return leafMap[lskAddress] ?? null;
}

export function getMultisigMap(lskAddress: string): Leaf[] {
	return multisigMap[lskAddress] ?? [];
}

export function loadMerkleTree() {
	if (!process.env.MERKLE_TREE_PATH || !fileExists(process.env.MERKLE_TREE_PATH)) {
		throw new Error(
			`MERKLE_TREE_PATH is invalid or does not exist: ${process.env.MERKLE_TREE_PATH}`,
		);
	}
	console.log(`Loading Merkle Tree: ${process.env.MERKLE_TREE_PATH}`);

	const { leaves } = readJson(process.env.MERKLE_TREE_PATH);
	for (const leaf of leaves) {
		leafMap[leaf.lskAddress] = leaf;
		if (leaf.numberOfSignatures > 0) {
			for (const key of leaf.mandatoryKeys.concat(leaf.optionalKeys)) {
				const lskAddress = address.getLisk32AddressFromPublicKey(Buffer.from(remove0x(key), 'hex'));
				if (!multisigMap[lskAddress]) {
					multisigMap[lskAddress] = [];
				}
				multisigMap[lskAddress].push(leaf);
			}
		}
	}

	console.log(`LeafMap: ${Object.keys(leafMap).length} Leaves loaded`);
	console.log(`MultisigMap: ${Object.keys(multisigMap).length} Multisig Account Holders loaded`);
}
