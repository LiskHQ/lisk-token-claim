import * as fs from 'fs';
import * as path from 'path';
import { ux } from '@oclif/core';
import { AirdropAccount } from '../../interface';
import { buildAirdropTree } from './build_airdrop_tree';

export async function buildAirdropTreeJson(outputPath: string, accounts: AirdropAccount[]) {
	const { tree, leaves } = buildAirdropTree(accounts);

	const merkleTreeResultDetailedJSONPath = path.join(
		outputPath,
		'merkle-tree-result-detailed.json',
	);
	fs.writeFileSync(
		merkleTreeResultDetailedJSONPath,
		JSON.stringify(
			{
				merkleRoot: tree.root,
				leaves,
			},
			null,
			4,
		),
		'utf-8',
	);
	ux.log(`Detailed result outputted to: ${merkleTreeResultDetailedJSONPath}`);

	const merkleTreeResultJSONPath = path.join(outputPath, 'merkle-tree-result.json');
	fs.writeFileSync(
		merkleTreeResultJSONPath,
		JSON.stringify(
			{
				merkleRoot: tree.root,
				leaves: leaves.map(leaf => ({
					b32Address: leaf.address,
					balanceWei: leaf.balanceWei,
					proof: leaf.proof,
				})),
			},
			null,
			4,
		),
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
