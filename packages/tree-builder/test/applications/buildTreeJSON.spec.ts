import { expect } from 'chai';
import * as fs from 'fs';
import { buildTreeJSON } from '../../src/applications/buildTreeJSON';
import { buildTree } from '../../src/applications/buildTree';
import { createAccounts } from '../../src/applications/example/create-accounts';

describe('buildTreeJSON', () => {
	// Playing around with `example` network
	const path = '../../data/example';

	before(() => {
		// Generate accounts.json
		createAccounts();
	});

	it('should build JSON files with correct params', () => {
		const accounts = JSON.parse(fs.readFileSync(`${path}/accounts.json`, 'utf-8'));
		const merkleTree = buildTree(accounts);
		buildTreeJSON(path);

		// Verify merkle-tree-result-detailed.json
		const merkleTreeResultDetailedJSON = JSON.parse(
			fs.readFileSync(`${path}/merkle-tree-result-detailed.json`, 'utf-8'),
		);
		expect(merkleTreeResultDetailedJSON.merkleRoot).equal(merkleTree.tree.root);
		expect(merkleTreeResultDetailedJSON.leaves.length).equal(merkleTree.leaves.length);
		for (let i = 0; i < merkleTree.leaves.length; i++) {
			const jsonLeaf = merkleTreeResultDetailedJSON.leaves[i];
			const merkleTreeLeaf = merkleTree.leaves[i];

			expect(jsonLeaf.address).equal(merkleTreeLeaf.address);
			expect(jsonLeaf.lskAddress).equal(merkleTreeLeaf.lskAddress);
			expect(jsonLeaf.balance).equal(merkleTreeLeaf.balance);
			expect(jsonLeaf.balanceBeddows).equal(merkleTreeLeaf.balanceBeddows);
			expect(jsonLeaf.numberOfSignatures).equal(merkleTreeLeaf.numberOfSignatures);
			expect(jsonLeaf.mandatoryKeys).deep.equal(merkleTreeLeaf.mandatoryKeys);
			expect(jsonLeaf.optionalKeys).deep.equal(merkleTreeLeaf.optionalKeys);
			expect(jsonLeaf.hash).equal(merkleTreeLeaf.hash);
			expect(jsonLeaf.proof).deep.equal(merkleTreeLeaf.proof);
		}

		// Verify merkle-tree-result.json
		const merkleTreeResultJSON = JSON.parse(
			fs.readFileSync(`${path}/merkle-tree-result.json`, 'utf-8'),
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
		const merkleRootJSON = JSON.parse(fs.readFileSync(`${path}/merkle-root.json`, 'utf-8'));
		expect(merkleRootJSON.merkleRoot).equal(merkleTree.tree.root);
	});
});
