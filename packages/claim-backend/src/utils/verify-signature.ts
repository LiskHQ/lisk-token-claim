import * as tweetnacl from 'tweetnacl';
import { AbiCoder, keccak256 } from 'ethers';

const abiCoder = new AbiCoder();
const BYTES_9 = '000000000000000000';

function verifySignature(
	hash: string,
	destination: string,
	publicKey: string,
	r: string,
	s: string,
) {
	const message = keccak256(abiCoder.encode(['bytes32', 'address'], [hash, destination])) + BYTES_9;

	try {
		return tweetnacl.sign.detached.verify(
			Buffer.from(message.substring(2), 'hex'),
			Buffer.from(r.substring(2).concat(s.substring(2)), 'hex'),
			Buffer.from(publicKey.substring(2), 'hex'),
		);
	} catch (err) {
		return false;
	}
}

export { BYTES_9, verifySignature };
