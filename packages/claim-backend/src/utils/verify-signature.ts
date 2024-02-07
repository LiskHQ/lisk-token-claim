import * as tweetnacl from 'tweetnacl';
import { keccak256 } from 'ethers';
import { defaultAbiCoder } from '@ethersproject/abi';
import { remove0x } from './index';

export const BYTES_9 = '000000000000000000';

export function verifySignature(
	hash: string,
	destination: string,
	publicKey: string,
	r: string,
	s: string,
) {
	const message =
		keccak256(defaultAbiCoder.encode(['bytes32', 'address'], [hash, destination])) + BYTES_9;

	try {
		return tweetnacl.sign.detached.verify(
			Buffer.from(remove0x(message), 'hex'),
			Buffer.from(remove0x(r).concat(remove0x(s)), 'hex'),
			Buffer.from(remove0x(publicKey), 'hex'),
		);
	} catch (err) {
		return false;
	}
}
