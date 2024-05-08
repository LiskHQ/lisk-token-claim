import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { buildTreeJson } from '../../src/applications/generate-merkle-tree/build_tree_json';
import { buildTree } from '../../src/applications/generate-merkle-tree/build_tree';
import { createAccounts } from '../../src/applications/example/create_accounts';
import { createKeyPairs } from '../../src/applications/example/create_key_pairs';

describe('buildTreeJSON', () => {
	// Playing around with `example`
	const jsonPath = '../../data/example';

	before(async () => {
		// Generate key-pairs.json
		await createKeyPairs();
		// Generate accounts.json
		createAccounts();
	});

	it('should build JSON files with correct params', async () => {
		const accounts = JSON.parse(
			await fs.promises.readFile(path.join(jsonPath, 'accounts.json'), 'utf-8'),
		);
		const merkleTree = buildTree(accounts);
		await buildTreeJson(jsonPath, accounts);

		// Verify merkle-tree-result-detailed.json
		const merkleTreeResultDetailedJSON = JSON.parse(
			await fs.promises.readFile(path.join(jsonPath, 'merkle-tree-result-detailed.json'), 'utf-8'),
		);
		expect(merkleTreeResultDetailedJSON.merkleRoot).equal(merkleTree.tree.root);
		expect(merkleTreeResultDetailedJSON.leaves.length).equal(merkleTree.leaves.length);
		for (let i = 0; i < merkleTree.leaves.length; i++) {
			const jsonLeaf = merkleTreeResultDetailedJSON.leaves[i];
			const merkleTreeLeaf = merkleTree.leaves[i];

			expect(jsonLeaf.address).equal(merkleTreeLeaf.address);
			expect(jsonLeaf.lskAddress).equal(merkleTreeLeaf.lskAddress);
			expect(jsonLeaf.balanceBeddows).equal(merkleTreeLeaf.balanceBeddows);
			expect(jsonLeaf.numberOfSignatures).equal(merkleTreeLeaf.numberOfSignatures);
			expect(jsonLeaf.mandatoryKeys).deep.equal(merkleTreeLeaf.mandatoryKeys);
			expect(jsonLeaf.optionalKeys).deep.equal(merkleTreeLeaf.optionalKeys);
			expect(jsonLeaf.hash).equal(merkleTreeLeaf.hash);
			expect(jsonLeaf.proof).deep.equal(merkleTreeLeaf.proof);
		}

		// Verify merkle-tree-result.json
		const merkleTreeResultJSON = JSON.parse(
			await fs.promises.readFile(path.join(jsonPath, 'merkle-tree-result.json'), 'utf-8'),
		);
		expect(merkleTreeResultJSON.merkleRoot).equal(merkleTree.tree.root);
		expect(merkleTreeResultJSON.leaves.length).equal(merkleTree.leaves.length);
		for (let i = 0; i < merkleTree.leaves.length; i++) {
			const jsonLeaf = merkleTreeResultJSON.leaves[i];
			const merkleTreeLeaf = merkleTree.leaves[i];

			expect(jsonLeaf.b32Address).equal(merkleTreeLeaf.address);
			expect(jsonLeaf.balanceBeddows).equal(merkleTreeLeaf.balanceBeddows);
			expect(jsonLeaf.numberOfSignatures).equal(merkleTreeLeaf.numberOfSignatures);
			expect(jsonLeaf.mandatoryKeys).deep.equal(merkleTreeLeaf.mandatoryKeys);
			expect(jsonLeaf.optionalKeys).deep.equal(merkleTreeLeaf.optionalKeys);
			expect(jsonLeaf.proof).deep.equal(merkleTreeLeaf.proof);
		}

		// Verify merkle-root.json
		const merkleRootJSON = JSON.parse(
			await fs.promises.readFile(path.join(jsonPath, 'merkle-root.json'), 'utf-8'),
		);
		expect(merkleRootJSON.merkleRoot).equal(merkleTree.tree.root);
	});
});
