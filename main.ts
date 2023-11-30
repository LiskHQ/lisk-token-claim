import { cryptography } from 'lisk-sdk';
import { solidityPacked, keccak256 } from 'ethers';
import * as fs from 'fs';
import { toBuffer } from 'ethereumjs-util';
import MerkleTree from './src/merkle-tree';

const LSK_MULTIPLIER = 10 ** 8;
const isExample = process.argv[2] === '--example';
const path = isExample ? './data/example' : './data/mainnet';

let data;
try {
	data = JSON.parse(fs.readFileSync(`${path}/balances.json`, 'utf-8'));
} catch (err) {
	console.log(`Error occurred reading ${path}/balances.json`);
	if (err instanceof Error) {
		console.log(err.message);
	}
	process.exit(1);
}

const nodes: {
	lskAddress: string;
	address: string;
	balance: number;
	balanceBeddows: number;
	numberOfSignatures: number;
	mandatoryKeys: string[];
	optionalKeys: string[];
	payload: string;
	hash: string;
	proof?: string[];
}[] = [];

console.log(`Running at ${isExample ? '** EXAMPLE **' : '** MAINNET **'}`);
console.log(`${data.length} Accounts to generate:`);
for (const account of data) {
	const address = cryptography.address.getAddressFromLisk32Address(account.lskAddress);
	const balanceBeddows = Math.floor(account.balance * LSK_MULTIPLIER);
	const payload = account.numberOfSignatures
		? solidityPacked(
				['bytes20', 'uint64', 'uint256', 'bytes', 'bytes'],
				[
					address,
					balanceBeddows,
					account.numberOfSignatures,
					'0x' + account.mandatoryKeys.join(''),
					'0x' + account.optionalKeys.join(''),
				],
		  )
		: solidityPacked(['bytes20', 'uint64', 'uint256'], [address, balanceBeddows, 0]);

	console.log(
		`${account.lskAddress}: ${account.balance} LSK (Multisig=${
			account.numberOfSignatures > 0 ? 'Y' : 'N'
		})`,
	);
	nodes.push({
		lskAddress: account.lskAddress,
		address: '0x' + address.toString('hex'),
		balance: account.balance,
		balanceBeddows,
		numberOfSignatures: account.numberOfSignatures ?? 0,
		mandatoryKeys: account.mandatoryKeys
			? account.mandatoryKeys.map((key: string) => '0x' + key)
			: [],
		optionalKeys: account.optionalKeys ? account.optionalKeys.map((key: string) => '0x' + key) : [],
		payload,
		hash: keccak256(payload),
	});
}

const elements = nodes.map(result => toBuffer(result.hash));

const merkleTree = new MerkleTree(elements);

for (const result of nodes) {
	result.proof = merkleTree.getHexProof(toBuffer(result.hash));
}

fs.writeFileSync(
	`${path}/merkle-tree-result.json`,
	JSON.stringify({
		merkleRoot: '0x' + merkleTree.getRoot().toString('hex'),
		nodes,
	}),
	'utf-8',
);
console.log(`Result outputted to: ${path}/merkle-tree-result.json`);

if (isExample) {
	// Create an extra file for Foundry Testing
	fs.writeFileSync(
		`${path}/merkle-tree-result-simple.json`,
		JSON.stringify({
			merkleRoot: '0x' + merkleTree.getRoot().toString('hex'),
			nodes: nodes.map(result => ({
				b32Address: result.address,
				balanceBeddows: result.balanceBeddows,
				mandatoryKeys: result.mandatoryKeys ?? [],
				numberOfSignatures: result.numberOfSignatures ?? 0,
				optionalKeys: result.optionalKeys ?? [],
				proof: result.proof,
			})),
		}),
		'utf-8',
	);
}
