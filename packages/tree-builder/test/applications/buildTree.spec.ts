import { expect } from 'chai';
import * as fs from 'fs';
import { AbiCoder, keccak256 } from 'ethers';
import { cryptography } from 'lisk-sdk';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { Account, DevValidator } from '../../src/interface';
import { createPayload, buildTree } from '../../src/applications/buildTree';
import { LEAF_ENCODING, LSK_MULTIPLIER } from '../../src/constants';

describe('buildTree', () => {
	const abiCoder = new AbiCoder();

	const devValidatorSorted = (
		JSON.parse(fs.readFileSync('../../data/example/dev-validators.json', 'utf-8')) as DevValidator
	).keys.sort((key1, key2) =>
		cryptography.address
			.getAddressFromLisk32Address(key1.address)
			.compare(cryptography.address.getAddressFromLisk32Address(key2.address)),
	);

	// Create 5 accounts on the fly, they are all Multisig such that all fields are filled
	const accounts = devValidatorSorted.slice(0, 5).map(key => {
		const balance = Number((10000 * Math.random()).toFixed(8));
		const numberOfMandatoryKeys = Math.floor(5 * Math.random()) + 1;
		const numberOfOptionalKeys = Math.floor(5 * Math.random());
		return {
			lskAddress: key.address,
			balance,
			balanceBeddows: Math.floor(balance * LSK_MULTIPLIER),
			numberOfSignatures: numberOfMandatoryKeys + numberOfOptionalKeys,
			mandatoryKeys: devValidatorSorted.slice(0, numberOfMandatoryKeys).map(key => key.publicKey),
			optionalKeys: devValidatorSorted
				.slice(numberOfMandatoryKeys, numberOfMandatoryKeys + numberOfOptionalKeys)
				.map(key => key.publicKey),
		};
	}) as Account[];

	it('should reject unsorted array of accounts', () => {
		const unsortedAccounts = [
			accounts[accounts.length - 1],
			...accounts.slice(1, accounts.length - 1),
			accounts[0],
		];
		expect(() => buildTree(unsortedAccounts)).throw(
			'Address not sorted! Please sort your addresses before continue',
		);
	});

	it('should return valid tree with proof', () => {
		const merkleTree = buildTree(accounts);
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
