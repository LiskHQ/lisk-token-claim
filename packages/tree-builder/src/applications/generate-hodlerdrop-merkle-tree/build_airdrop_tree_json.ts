import { promises as fs } from 'fs';
import * as path from 'path';
import { ux } from '@oclif/core';
import { HodlerdropAccount } from '../../interface';
import { buildAirdropTree } from './build_airdrop_tree';

export async function buildAirdropTreeJson(
	outputPath: string,
	accounts: HodlerdropAccount[],
	airdropAmount: bigint,
	unclaimedAmount: bigint,
) {
	const { tree, leaves } = buildAirdropTree(accounts, airdropAmount, unclaimedAmount);

	const hodlerdropMerkleTreeResultJSONPath = path.join(
		outputPath,
		'hodlerdrop-merkle-tree-result.json',
	);

	await fs.writeFile(
		hodlerdropMerkleTreeResultJSONPath,
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
	ux.log(`Hodlerdrop Merkle Tree result outputted to: ${hodlerdropMerkleTreeResultJSONPath}`);

	const merkleRootJSONPath = path.join(outputPath, 'hodlerdrop-merkle-root.json');
	await fs.writeFile(
		merkleRootJSONPath,
		JSON.stringify({
			merkleRoot: tree.root,
		}),
		'utf-8',
	);
	ux.log(`MerkleRoot outputted to: ${merkleRootJSONPath}`);
}
