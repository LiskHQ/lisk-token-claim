import * as fs from 'fs';
import { AbiCoder, keccak256 } from 'ethers';
import * as tweetnacl from 'tweetnacl';
import { Balances, DevValidator, DevValidatorKey } from '../../src/interface';

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

const keys = (
	JSON.parse(fs.readFileSync('./data/example/dev-validators.json', 'utf-8')) as DevValidator
).keys;
const balances = JSON.parse(
	fs.readFileSync('./data/example/merkle-tree-result.json', 'utf-8'),
) as Balances;

const signMessage = (message: string, key: DevValidatorKey): string => {
	return Buffer.from(
		tweetnacl.sign.detached(
			Buffer.from(message.substring(2), 'hex'),
			Buffer.from(key.privateKey, 'hex'),
		),
	).toString('hex');
};

const recipient = '0x34A1D3fff3958843C43aD80F30b94c510645C316';
const BYTES_9 = '000000000000000000';

const signatures: Signature[] = [];

for (const leaf of balances.leaves) {
	const message =
		keccak256(abiCoder.encode(['bytes32', 'address'], [leaf.hash, recipient])) + BYTES_9;

	const sigs: SigPair[] = [];

	// Regular Account
	if (leaf.numberOfSignatures === 0) {
		const key = keys.find(key => key.address === leaf.lskAddress)!;
		const signature = signMessage(message, key);

		sigs.push({
			pubKey: '0x' + key.publicKey,
			r: '0x' + signature.substring(0, 64),
			s: '0x' + signature.substring(64),
		});
	} else {
		// Multisig Account
		// Signing all keys regardless of required amount
		for (const pubKey of leaf.mandatoryKeys.concat(leaf.optionalKeys)) {
			const key = keys.find(key => '0x' + key.publicKey === pubKey)!;
			const signature = signMessage(message, key);

			sigs.push({
				pubKey: '0x' + key.publicKey,
				r: '0x' + signature.substring(0, 64),
				s: '0x' + signature.substring(64),
			});
		}
	}

	signatures.push({
		message,
		sigs,
	});
}

fs.writeFileSync('./data/example/signatures.json', JSON.stringify(signatures), 'utf-8');
