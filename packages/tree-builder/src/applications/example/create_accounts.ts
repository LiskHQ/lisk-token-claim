import * as fs from 'fs';
import { address } from '@liskhq/lisk-cryptography';
import { Account, ExampleKey } from '../../interface';
import { randomBalanceBeddows } from '../../utils';

// Random Balance in Beddows between 0 - 2 ** (8 * RANDOM_BYTES_RANGE)
const RANDOM_BYTES_RANGE = 5;

// Multisig Accounts
// For each account it will use the address of the index as account holder,
// while the "keys" are used from #0 onwards

// First (numberOfAccounts - multiSigs.length) accounts would be regular accounts
// For e.g. numberOfAccounts = 54
// #50: numSig 3  => 3m
// #51: numSig 2  => 1m + 2o
// #52: numSig 5  => 3m + 3o
// #53: numSig 64 => 64m
const multiSigs = [
	{
		numberOfSignatures: 3,
		numberOfMandatoryKeys: 3,
		numberOfOptionalKeys: 0,
	},
	{
		numberOfSignatures: 2,
		numberOfMandatoryKeys: 1,
		numberOfOptionalKeys: 2,
	},
	{
		numberOfSignatures: 5,
		numberOfMandatoryKeys: 3,
		numberOfOptionalKeys: 3,
	},
	{
		numberOfSignatures: 64,
		numberOfMandatoryKeys: 64,
		numberOfOptionalKeys: 0,
	},
];

export function createAccounts(numberOfAccounts = 54) {
	const keyPairs = JSON.parse(
		fs.readFileSync('../../data/example/key-pairs.json', 'utf-8'),
	) as ExampleKey[];

	// to ensure a deterministic tree construction, the accounts array must be sorted in lexicographical order of their addr entries.
	const sortedKeyPairs = [...keyPairs].sort((key1, key2) =>
		address
			.getAddressFromLisk32Address(key1.address)
			.compare(address.getAddressFromLisk32Address(key2.address)),
	);

	const results: Account[] = [];

	// Regular Accounts
	for (let index = 0; index < numberOfAccounts - multiSigs.length; index++) {
		const account = sortedKeyPairs[index];
		const balanceBeddows = randomBalanceBeddows(RANDOM_BYTES_RANGE);

		results.push({
			lskAddress: account.address,
			balanceBeddows: balanceBeddows.toString(),
		});
	}

	for (const multiSig of multiSigs) {
		const account = sortedKeyPairs[results.length];
		const balanceBeddows = randomBalanceBeddows(RANDOM_BYTES_RANGE);

		results.push({
			lskAddress: account.address,
			balanceBeddows,
			numberOfSignatures: multiSig.numberOfSignatures,
			mandatoryKeys: [...Array(multiSig.numberOfMandatoryKeys).keys()].map(
				(_, index) => keyPairs[index].publicKey,
			),
			optionalKeys: [...Array(multiSig.numberOfOptionalKeys).keys()].map(
				(_, index) => keyPairs[index + multiSig.numberOfMandatoryKeys].publicKey,
			),
		});
	}

	fs.writeFileSync('../../data/example/accounts.json', JSON.stringify(results), 'utf-8');
}
