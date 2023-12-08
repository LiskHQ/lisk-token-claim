import * as fs from 'fs';
import { MerkleTree } from '../src/interface';
import { AbiCoder, keccak256 } from 'ethers';

describe('main', () => {
	const abiCoder = new AbiCoder();
	const merkleTree = JSON.parse(
		fs.readFileSync('./data/example/merkle-tree-result.json', 'utf-8'),
	) as MerkleTree;

	it('should use correct encoding', () => {
		for (const leaf of merkleTree.leaves) {
			const encodedMessage = abiCoder.encode(
				['bytes20', 'uint64', 'uint32', 'bytes32[]', 'bytes32[]'],
				[
					leaf.address,
					leaf.balanceBeddows,
					leaf.numberOfSignatures,
					leaf.mandatoryKeys,
					leaf.optionalKeys,
				],
			);
			expect(leaf.hash).toEqual(keccak256(keccak256(encodedMessage)));
		}
	});

	it('leaves should be sorted by address', () => {
		for (const [index, leaf] of merkleTree.leaves.entries()) {
			// Last leaf
			if (index === merkleTree.leaves.length - 1) {
				continue;
			}
			expect(leaf.address < merkleTree.leaves[index + 1].address).toEqual(true);
		}
	});
});
