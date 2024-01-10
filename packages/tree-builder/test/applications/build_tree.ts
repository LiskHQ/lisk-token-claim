import { expect } from 'chai';
import * as fs from 'fs';
import { AbiCoder, keccak256 } from 'ethers';
import { address } from '@liskhq/lisk-cryptography';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { Account, ExampleKey } from '../../src/interface';
import { createPayload, build_tree } from '../../src/applications/generate-merkle-tree/build_tree';
import { LEAF_ENCODING, LSK_MULTIPLIER } from '../../src/constants';
import { createKeyPairs } from '../../src/applications/example/create_key_pairs';

describe('buildTree', () => {
	const abiCoder = new AbiCoder();

	let accounts: Account[];
	before(async () => {
		await createKeyPairs();
		const keyPairsSorted = (
			JSON.parse(fs.readFileSync('../../data/example/key-pairs.json', 'utf-8')) as ExampleKey[]
		).sort((key1, key2) =>
			address
				.getAddressFromLisk32Address(key1.address)
				.compare(address.getAddressFromLisk32Address(key2.address)),
		);

		// Create 5 accounts on the fly, they are all Multisig such that all fields are filled
		accounts = keyPairsSorted.slice(0, 5).map(key => {
			const balance = Number((10000 * Math.random()).toFixed(8));
			const numberOfMandatoryKeys = Math.floor(5 * Math.random()) + 1;
			const numberOfOptionalKeys = Math.floor(5 * Math.random());
			return {
				lskAddress: key.address,
				balance,
				balanceBeddows: Math.floor(balance * LSK_MULTIPLIER),
				numberOfSignatures: numberOfMandatoryKeys + numberOfOptionalKeys,
				mandatoryKeys: keyPairsSorted.slice(0, numberOfMandatoryKeys).map(key => key.publicKey),
				optionalKeys: keyPairsSorted
					.slice(numberOfMandatoryKeys, numberOfMandatoryKeys + numberOfOptionalKeys)
					.map(key => key.publicKey),
			};
		}) as Account[];
	});
	it('should reject unsorted array of accounts', () => {
		const unsortedAccounts = [
			accounts[accounts.length - 1],
			...accounts.slice(1, accounts.length - 1),
			accounts[0],
		];
		expect(() => build_tree(unsortedAccounts)).throw(
			'Address not sorted! Please sort your addresses before continue',
		);
	});

	it('should return valid tree with proof', () => {
		const merkleTree = build_tree(accounts);
		for (const [i, leaf] of merkleTree.leaves.entries()) {
			const accountOfLeaf = accounts.find(account => account.lskAddress === leaf.lskAddress)!;
			const encodedMessage = abiCoder.encode(LEAF_ENCODING, createPayload(accountOfLeaf));

			// Verify Leaf is in correct order
			expect(leaf.lskAddress).equal(accounts[i].lskAddress);

			// Verify Encoding
			expect(leaf.hash).equal(keccak256(keccak256(encodedMessage)));

			// Verify Proof exists in MerkleTree
			expect(merkleTree.tree.getProof(createPayload(accountOfLeaf))).deep.equal(leaf.proof);

			// Verify Proof is valid with respect to MerkleRoot
			expect(
				StandardMerkleTree.verify(
					merkleTree.tree.root,
					LEAF_ENCODING,
					createPayload(accountOfLeaf),
					leaf.proof,
				),
			).deep.equal(true);
		}
	});
});
