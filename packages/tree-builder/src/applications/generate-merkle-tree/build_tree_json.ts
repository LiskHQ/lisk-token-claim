import * as fs from 'fs';
import * as path from 'path';
import { Account } from '../../interface';
import { build_tree } from './build_tree';

export function buildTreeJson(outputPath: string) {
	let accounts: Account[];

	const accountsPath = path.join(outputPath, 'accounts.json');
	try {
		accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8')) as Account[];
	} catch (err) {
		console.log(`Error occurred reading ${accountsPath}`);
		if (err instanceof Error) {
			console.log(err.message);
		}
		process.exit(1);
	}

	const { tree, leaves } = build_tree(accounts);

	console.log('===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====');

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
	console.log(`Detailed result outputted to: ${merkleTreeResultDetailedJSONPath}`);

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
	console.log(`Lightweight result outputted to: ${merkleTreeResultJSONPath}`);

	const merkleRootJSONPath = path.join(outputPath, 'merkle-root.json');
	fs.writeFileSync(
		merkleRootJSONPath,
		JSON.stringify({
			merkleRoot: tree.root,
		}),
		'utf-8',
	);
	console.log(`MerkleRoot outputted to: ${merkleRootJSONPath}`);
}