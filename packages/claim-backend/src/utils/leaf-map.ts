import { AirdropLeaf, Leaf } from '../interface';
import { address } from '@liskhq/lisk-cryptography';
import { remove0x } from './index';
import { readJson } from './fs-helper';

const leafMap: {
	[lskAddress: string]: Leaf;
} = {};

const multisigMap: {
	[lskAddress: string]: Leaf[];
} = {};

const airdropLeafMap: {
	[lskAddress: string]: AirdropLeaf;
} = {};

export function getLeafMap(lskAddress: string): Leaf | null {
	return leafMap[lskAddress] ?? null;
}

export function getMultisigMap(lskAddress: string): Leaf[] {
	return multisigMap[lskAddress] ?? [];
}

export function getAirdropLeafMap(lskAddress: string): AirdropLeaf | null {
	return airdropLeafMap[lskAddress] ?? null;
}

export async function loadMerkleTree() {
	if (!process.env.MERKLE_TREE_PATH) {
		throw new Error(
			`MERKLE_TREE_PATH is invalid or does not exist: ${process.env.MERKLE_TREE_PATH}`,
		);
	}
	console.log(`Loading Merkle Tree: ${process.env.MERKLE_TREE_PATH}`);

	const { leaves } = await readJson(process.env.MERKLE_TREE_PATH);
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

export async function loadAirdropMerkleTree() {
	const airdropMerkleTreePath = process.env.AIRDROP_MERKLE_TREE_PATH;
	if (!airdropMerkleTreePath) {
		throw new Error(
			`AIRDROP_MERKLE_TREE_PATH is invalid or does not exist: ${airdropMerkleTreePath}`,
		);
	}
	console.log(`Loading Airdrop Merkle Tree: ${airdropMerkleTreePath}`);

	const { leaves } = await readJson(airdropMerkleTreePath);
	for (const leaf of leaves) {
		airdropLeafMap[leaf.lskAddress] = leaf;
	}

	console.log(`AirdropLeafMap: ${Object.keys(airdropLeafMap).length} Leaves loaded`);
}
