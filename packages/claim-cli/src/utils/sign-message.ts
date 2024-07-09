import * as tweetnacl from 'tweetnacl';
import { AbiCoder, keccak256 } from 'ethers';
import { BYTES_9, remove0x } from './prefix';

export function signMessage(hash: string, destinationAddress: string, privKey: Buffer): string {
	const abiCoder = new AbiCoder();

	const message =
		keccak256(abiCoder.encode(['bytes32', 'address'], [hash, destinationAddress])) + BYTES_9;

	return Buffer.from(
		tweetnacl.sign.detached(Buffer.from(remove0x(message), 'hex'), privKey),
	).toString('hex');
}
