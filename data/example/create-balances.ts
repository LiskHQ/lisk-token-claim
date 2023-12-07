import { cryptography } from 'lisk-sdk';
import * as fs from 'fs';
import { DevValidator } from '../../src/interface';

// 1 LSK = 10^8 Beddows
const LSK_MULTIPLIER = 10 ** 8;

// Create Balances
// [#0 - #49] First 50 addresses are regular addresses
const NUM_OF_REGULAR_ACCOUNTS = 50;

// Multisig Accounts
// For each account it will use the address of the index as account holder,
// while the "keys" are used from #0 onwards

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

const randomBalance = (startAmount: number): number =>
	Number((startAmount + Math.random()).toFixed(8));

const accounts = (
	JSON.parse(fs.readFileSync('./data/example/dev-validators.json', 'utf-8')) as DevValidator
).keys;

// to ensure a deterministic tree construction, the accounts array must be sorted in lexicographical order of their addr entries.
const sortedAccounts = [...accounts].sort((key1, key2) =>
	cryptography.address
		.getAddressFromLisk32Address(key1.address)
		.compare(cryptography.address.getAddressFromLisk32Address(key2.address)),
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
for (let index = 0; index < NUM_OF_REGULAR_ACCOUNTS; index++) {
	const account = sortedAccounts[index];
	const balance = randomBalance(index);
	const balanceBeddows = Math.floor(balance * LSK_MULTIPLIER);

	results.push({
		lskAddress: account.address,
		balance,
		balanceBeddows,
	});
}

for (const multiSig of multiSigs) {
	const account = sortedAccounts[results.length];
	const balance = randomBalance(results.length);
	const balanceBeddows = Math.floor(balance * LSK_MULTIPLIER);

	results.push({
		lskAddress: account.address,
		balance,
		balanceBeddows,
		numberOfSignatures: multiSig.numberOfSignatures,
		mandatoryKeys: [...Array(multiSig.numberOfMandatoryKeys).keys()].map(
			(_, index) => accounts[index].publicKey,
		),
		optionalKeys: [...Array(multiSig.numberOfOptionalKeys).keys()].map(
			(_, index) => accounts[index + multiSig.numberOfMandatoryKeys].publicKey,
		),
	});
}

fs.writeFileSync('./data/example/balances.json', JSON.stringify(results), 'utf-8');
