import * as fs from 'fs';
import * as path from 'path';
import { ux } from '@oclif/core';
import { Account } from '../../interface';
import { buildTree } from './build_tree';

export async function buildTreeJson(outputPath: string, accounts: Account[]) {
	const { tree, leaves } = buildTree(accounts);

	const merkleTreeResultDetailedJSONPath = path.join(
		outputPath,
		'merkle-tree-result-detailed.json',
	);
	fs.writeFileSync(
		merkleTreeResultDetailedJSONPath,
		JSON.stringify({
			merkleRoot: tree.root,
			leaves,
		}),
		'utf-8',
	);
	ux.log(`Detailed result outputted to: ${merkleTreeResultDetailedJSONPath}`);

	const merkleTreeResultJSONPath = path.join(outputPath, 'merkle-tree-result.json');
	fs.writeFileSync(
		merkleTreeResultJSONPath,
		JSON.stringify({
			merkleRoot: tree.root,
			leaves: leaves.map(leaf => ({
				b32Address: leaf.address,
				balanceBeddows: leaf.balanceBeddows,
				mandatoryKeys: leaf.mandatoryKeys ?? [],
				numberOfSignatures: leaf.numberOfSignatures ?? 0,
				optionalKeys: leaf.optionalKeys ?? [],
				proof: leaf.proof,
			})),
		}),
		'utf-8',
	);
	ux.log(`Lightweight result outputted to: ${merkleTreeResultJSONPath}`);

	const merkleRootJSONPath = path.join(outputPath, 'merkle-root.json');
	fs.writeFileSync(
		merkleRootJSONPath,
		JSON.stringify({
			merkleRoot: tree.root,
		}),
		'utf-8',
	);
	ux.log(`MerkleRoot outputted to: ${merkleRootJSONPath}`);
}
