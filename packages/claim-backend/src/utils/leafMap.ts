import fs from 'fs';
import { Leaf } from './interface';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MERKLE_TREE_PATH || !fs.existsSync(process.env.MERKLE_TREE_PATH)) {
	throw new Error(`MERKLE_TREE_PATH is invalid or does not exist: ${process.env.MERKLE_TREE_PATH}`);
}

console.log(`Loading Merkle Tree: ${process.env.MERKLE_TREE_PATH}`);

const { leaves } = JSON.parse(fs.readFileSync(process.env.MERKLE_TREE_PATH, 'utf-8'));

const leafMap: {
	[lskAddress: string]: Leaf;
} = {};

const multisigMap: {
	[pubKey: string]: Leaf[];
} = {};

for (const leaf of leaves) {
	leafMap[leaf.lskAddress] = leaf;
	if (leaf.numberOfSignatures > 0) {
		for (const key of leaf.mandatoryKeys.concat(leaf.optionalKeys)) {
			if (!multisigMap[key]) {
				multisigMap[key] = [];
			}
			multisigMap[key].push(leaf);
		}
	}
}

console.log(`LeafMap: ${Object.keys(leafMap).length} Leaves loaded`);
console.log(`MultisigMap: ${Object.keys(multisigMap).length} Multisig Account Holders loaded`);

export { leafMap, multisigMap };
