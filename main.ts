import { cryptography } from 'lisk-sdk';
import * as fs from 'fs';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { Balance, Leaf } from './src/interface';

const isExample = process.argv[2] === '--example';
const path = isExample ? './data/example' : './data/mainnet';

let balances;
try {
	balances = JSON.parse(fs.readFileSync(`${path}/balances.json`, 'utf-8')) as Balance[];

	// Check that addresses are sorted
	for (const [index, balance] of balances.entries()) {
		// Last address, skip
		if (index === balances.length - 1) {
			continue;
		}
		if (
			cryptography.address
				.getAddressFromLisk32Address(balance.lskAddress)
				.compare(
					cryptography.address.getAddressFromLisk32Address(balances[index + 1].lskAddress),
				) === 1
		) {
			throw new Error(
				'Address not sorted! Please sort your addresses in balances.json before continue',
			);
		}
	}
} catch (err) {
	console.log(`Error occurred reading ${path}/balances.json`);
	if (err instanceof Error) {
		console.log(err.message);
	}
	process.exit(1);
}

const leaves: Leaf[] = [];

console.log(`Running at ${isExample ? '** EXAMPLE **' : '** MAINNET **'}`);
console.log(`${balances.length} Accounts to generate:`);

const tree = StandardMerkleTree.of(
	balances.map(account => {
		const address = cryptography.address.getAddressFromLisk32Address(account.lskAddress);
		return [
			address,
			account.balanceBeddows,
			account.numberOfSignatures ?? 0,
			account.mandatoryKeys ? account.mandatoryKeys.map(key => '0x' + key) : [],
			account.optionalKeys ? account.optionalKeys.map(key => '0x' + key) : [],
		];
	}),
	['bytes20', 'uint64', 'uint32', 'bytes32[]', 'bytes32[]'],
);

for (const account of balances) {
	const address = cryptography.address.getAddressFromLisk32Address(account.lskAddress);
	const payload = [
		address,
		account.balanceBeddows,
		account.numberOfSignatures ?? 0,
		account.mandatoryKeys ? account.mandatoryKeys.map(key => '0x' + key) : [],
		account.optionalKeys ? account.optionalKeys.map(key => '0x' + key) : [],
	];

	console.log(
		`${account.lskAddress}: ${account.balance} LSK (Multisig=${
			account.numberOfSignatures > 0 ? 'Y' : 'N'
		})`,
	);

	leaves.push({
		lskAddress: account.lskAddress,
		address: '0x' + address.toString('hex'),
		balance: account.balance,
		balanceBeddows: account.balanceBeddows,
		numberOfSignatures: account.numberOfSignatures ?? 0,
		mandatoryKeys: account.mandatoryKeys
			? account.mandatoryKeys.map((key: string) => '0x' + key)
			: [],
		optionalKeys: account.optionalKeys ? account.optionalKeys.map((key: string) => '0x' + key) : [],
		hash: tree.leafHash(payload),
		proof: tree.getProof(payload),
	});
}

fs.writeFileSync(
	`${path}/merkle-tree-result.json`,
	JSON.stringify({
		merkleRoot: tree.root,
		leaves,
	}),
	'utf-8',
);

console.log(`Result outputted to: ${path}/merkle-tree-result.json`);

if (isExample) {
	// Create an extra file for Foundry Testing
	fs.writeFileSync(
		`${path}/merkle-tree-result-simple.json`,
		JSON.stringify({
			merkleRoot: tree.root,
			leaves: leaves.map(leaf => ({
				b32Address: leaf.address,
				balanceBeddows: leaf.balanceBeddows,
				mandatoryKeys: leaf.mandatoryKeys ?? [],
				numberOfSignatures: leaf.numberOfSignatures ?? 0,
				optionalKeys: leaf.optionalKeys ?? [],
				proof: leaf.proof,
			})),
		}),
		'utf-8',
	);
}
