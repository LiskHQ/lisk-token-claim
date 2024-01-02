import * as fs from 'fs';
import { AbiCoder, keccak256 } from 'ethers';
import { cryptography } from 'lisk-sdk';
import { Account, DevValidator } from '../src/interface';
import { createPayload, buildTree } from '../src/buildTree';

// 1 LSK = 10^8 Beddows
const LSK_MULTIPLIER = 10 ** 8;

describe('buildTree', () => {
	const abiCoder = new AbiCoder();

	const devValidatorSorted = (
		JSON.parse(fs.readFileSync('./data/example/dev-validators.json', 'utf-8')) as DevValidator
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
			optionalKeys: devValidatorSorted.slice(numberOfMandatoryKeys, numberOfMandatoryKeys + numberOfOptionalKeys).map(key => key.publicKey)
		};
	}) as Account[];

	it('should reject unsorted array of accounts', () => {
		const unsortedAccounts = [
			accounts[accounts.length - 1],
			...accounts.slice(1, accounts.length - 1),
			accounts[0],
		];
		expect(() => buildTree(unsortedAccounts)).toThrow(
			'Address not sorted! Please sort your addresses before continue',
		);
	});

	it('should return valid tree with proof', () => {
		const merkleTree = buildTree(accounts);
		for (const leaf of merkleTree.leaves) {
			const accountOfLeaf = accounts.find(account => account.lskAddress === leaf.lskAddress)!;

			const encodedMessage = abiCoder.encode(
				['bytes20', 'uint64', 'uint32', 'bytes32[]', 'bytes32[]'],
				createPayload(accountOfLeaf),
			);

			// Verify Encoding
			expect(leaf.hash).toEqual(keccak256(keccak256(encodedMessage)));

			// Verify Proof
			expect(merkleTree.tree.getProof(createPayload(accountOfLeaf))).toEqual(leaf.proof);
		}
	});
});
