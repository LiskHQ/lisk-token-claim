import * as fs from 'fs';
import { address } from '@liskhq/lisk-cryptography';
import { ExampleKey } from '../../interface';

// 1 LSK = 10^8 Beddows
const LSK_MULTIPLIER = 10 ** 8;

// Balances are random between 0 - <RANDOM_RANGE>
const RANDOM_RANGE = 10000;

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

const randomBalance = (range: number): number => Number((range * Math.random()).toFixed(8));

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

	const results: {
		lskAddress: string;
		balance: number;
		balanceBeddows: number;
		numberOfSignatures?: number;
		mandatoryKeys?: string[];
		optionalKeys?: string[];
	}[] = [];

	// Regular Accounts
	for (let index = 0; index < numberOfAccounts - multiSigs.length; index++) {
		const account = sortedKeyPairs[index];
		const balance = randomBalance(RANDOM_RANGE);
		const balanceBeddows = Math.round(balance * LSK_MULTIPLIER);

		results.push({
			lskAddress: account.address,
			balance,
			balanceBeddows,
		});
	}

	for (const multiSig of multiSigs) {
		const account = sortedKeyPairs[results.length];
		const balance = randomBalance(RANDOM_RANGE);
		const balanceBeddows = Math.round(balance * LSK_MULTIPLIER);

		results.push({
			lskAddress: account.address,
			balance,
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
