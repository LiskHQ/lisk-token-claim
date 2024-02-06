import { expect } from 'chai';
import * as fs from 'fs';
import { keccak256 } from 'ethers';
import { address, utils } from '@liskhq/lisk-cryptography';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { defaultAbiCoder } from '@ethersproject/abi';
import { Account, ExampleKey } from '../../src/interface';
import { createPayload, buildTree } from '../../src/applications/generate-merkle-tree/build_tree';
import { LEAF_ENCODING } from '../../src/constants';
import { createKeyPairs } from '../../src/applications/example/create_key_pairs';
import { append0x, randomBalanceBeddows } from '../../src/utils';

describe('buildTree', () => {
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
			const numberOfMandatoryKeys = Math.floor(5 * Math.random()) + 1;
			const numberOfOptionalKeys = Math.floor(5 * Math.random());
			return {
				lskAddress: key.address,
				balanceBeddows: randomBalanceBeddows(),
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
		expect(() => buildTree(unsortedAccounts)).throw(
			'Address not sorted! Please sort your addresses before continue',
		);
	});

	it('should return valid tree with proof', () => {
		const merkleTree = buildTree(accounts);
		for (const [i, leaf] of merkleTree.leaves.entries()) {
			const encodedMessage = defaultAbiCoder.encode(LEAF_ENCODING, createPayload(accounts[i]));

			// Verify Leaf is in correct order
			expect(leaf.lskAddress).equal(accounts[i].lskAddress);

			// Verify Encoding
			expect(leaf.hash).equal(keccak256(keccak256(encodedMessage)));

			// Verify Proof exists in MerkleTree
			expect(merkleTree.tree.getProof(createPayload(accounts[i]))).deep.equal(leaf.proof);

			// Verify Proof is valid with respect to MerkleRoot
			expect(
				StandardMerkleTree.verify(
					merkleTree.tree.root,
					LEAF_ENCODING,
					createPayload(accounts[i]),
					leaf.proof,
				),
			).deep.equal(true);
		}
	});

	it('should generate identical tree comparing with calling OZ library directly, and handle uint64 balances correctly', () => {
		// 2 ** 64 - 1 = 18446744073709551615: https://www.wolframalpha.com/input?i=2%5E64+-1
		const account = {
			lskAddress: address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32)),
			balanceBeddows: '18446744073709551615',
			numberOfSignatures: 2,
			mandatoryKeys: [append0x(utils.getRandomBytes(32))],
			optionalKeys: [append0x(utils.getRandomBytes(32)), append0x(utils.getRandomBytes(32))],
		} as Account;

		const merkleTreeFromBuildTree = buildTree([account]);
		const merkleTreeFromOz = StandardMerkleTree.of(
			[
				[
					append0x(address.getAddressFromLisk32Address(account.lskAddress)),
					account.balanceBeddows,
					account.numberOfSignatures,
					account.mandatoryKeys,
					account.optionalKeys,
				],
			],
			LEAF_ENCODING,
		);
		expect(merkleTreeFromBuildTree.tree.root).to.be.equal(merkleTreeFromOz.root);

		const merkleTreeFromOzDump = merkleTreeFromOz.dump();
		const ozLeaf = merkleTreeFromOzDump.values[0].value;
		expect(merkleTreeFromBuildTree.leaves[0].address).to.be.equal(ozLeaf[0]);
		expect(merkleTreeFromBuildTree.leaves[0].balanceBeddows).to.be.equal(ozLeaf[1]);
		expect(merkleTreeFromBuildTree.leaves[0].numberOfSignatures).to.be.equal(ozLeaf[2]);
		expect(merkleTreeFromBuildTree.leaves[0].mandatoryKeys).to.be.deep.equal(ozLeaf[3]);
		expect(merkleTreeFromBuildTree.leaves[0].optionalKeys).to.be.deep.equal(ozLeaf[4]);
	});
});
