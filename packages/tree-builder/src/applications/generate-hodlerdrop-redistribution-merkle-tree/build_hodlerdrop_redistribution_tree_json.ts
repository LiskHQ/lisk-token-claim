import { promises as fs } from 'fs';
import * as path from 'path';
import { ux } from '@oclif/core';
import { AirdropClaimedAccount } from '../../interface';
import { buildHodlerdropRedistributionTree } from './build_hodlerdrop_redistribution_tree';

export async function buildHodlerdropRedistributionTreeJson(
	outputPath: string,
	accounts: AirdropClaimedAccount[],
	airdropAmount: bigint,
	unclaimedAmount: bigint,
) {
	const { tree, leaves } = buildHodlerdropRedistributionTree(
		accounts,
		airdropAmount,
		unclaimedAmount,
	);

	const hodlerdropRedistributionMerkleTreeResultJSONPath = path.join(
		outputPath,
		'hodlerdrop-redistribution-merkle-tree-result.json',
	);

	await fs.writeFile(
		hodlerdropRedistributionMerkleTreeResultJSONPath,
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
	ux.log(
		`Hodlerdrop Redistribution Merkle Tree result outputted to: ${hodlerdropRedistributionMerkleTreeResultJSONPath}`,
	);

	const merkleRootJSONPath = path.join(outputPath, 'hodlerdrop-redistribution-merkle-root.json');
	await fs.writeFile(
		merkleRootJSONPath,
		JSON.stringify({
			merkleRoot: tree.root,
		}),
		'utf-8',
	);
	ux.log(`MerkleRoot outputted to: ${merkleRootJSONPath}`);
}
