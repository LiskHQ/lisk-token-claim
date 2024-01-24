import * as fs from 'fs';
import { AbiCoder, keccak256 } from 'ethers';
import * as tweetnacl from 'tweetnacl';
import { MerkleTree, ExampleKey } from '../../interface';
import { append0x } from '../../utils';

interface SigPair {
	pubKey: string;
	r: string;
	s: string;
}

interface Signature {
	message: string;
	sigs: SigPair[];
}

const abiCoder = new AbiCoder();
const signMessage = (message: string, key: ExampleKey): string => {
	return Buffer.from(
		tweetnacl.sign.detached(
			Buffer.from(message.substring(2), 'hex'),
			Buffer.from(key.privateKey, 'hex'),
		),
	).toString('hex');
};

const BYTES_9 = '000000000000000000';

export function signAccounts(recipient: string) {
	const keys = JSON.parse(
		fs.readFileSync('../../data/example/key-pairs.json', 'utf-8'),
	) as ExampleKey[];

	const merkleTree = JSON.parse(
		fs.readFileSync('../../data/example/merkle-tree-result-detailed.json', 'utf-8'),
	) as MerkleTree;
	const signatures: Signature[] = [];

	for (const leaf of merkleTree.leaves) {
		const message =
			keccak256(abiCoder.encode(['bytes32', 'address'], [leaf.hash, recipient])) + BYTES_9;

		const sigs: SigPair[] = [];

		// Regular Account
		if (leaf.numberOfSignatures === 0) {
			const key = keys.find(key => key.address === leaf.lskAddress)!;
			const signature = signMessage(message, key);

			sigs.push({
				pubKey: append0x(key.publicKey),
				r: append0x(signature.substring(0, 64)),
				s: append0x(signature.substring(64)),
			});
		} else {
			// Multisig Account
			// Signing with all keys regardless of the required number of signatures
			for (const pubKey of leaf.mandatoryKeys.concat(leaf.optionalKeys)) {
				const key = keys.find(key => append0x(key.publicKey) === pubKey)!;
				const signature = signMessage(message, key);

				sigs.push({
					pubKey: append0x(key.publicKey),
					r: append0x(signature.substring(0, 64)),
					s: append0x(signature.substring(64)),
				});
			}
		}

		signatures.push({
			message,
			sigs,
		});
	}

	fs.writeFileSync('../../data/example/signatures.json', JSON.stringify(signatures), 'utf-8');
}
