import { expect } from 'chai';
import * as tweetnacl from 'tweetnacl';
import { AbiCoder, keccak256 } from 'ethers';
import { BYTES_9, verifySignature } from '../../src/utils/verify-signature';
import { randomEthAddress, randomHash } from '../utils';
import { append0x } from '../../src/utils';

const abiCoder = new AbiCoder();

describe('verifySignature', () => {
	it('should return false when signature is invalid', () => {
		expect(
			verifySignature(randomHash(), randomEthAddress(), randomHash(), randomHash(), randomHash()),
		).to.be.false;
	});

	it('should return true when signature is valid', () => {
		const { publicKey, secretKey: privateKey } = tweetnacl.sign.keyPair();
		const hash = randomHash();
		const destination = randomEthAddress();
		const message =
			keccak256(abiCoder.encode(['bytes32', 'address'], [hash, destination])) + BYTES_9;

		const signature = Buffer.from(
			tweetnacl.sign.detached(Buffer.from(message.substring(2), 'hex'), privateKey),
		).toString('hex');
		const r = append0x(signature.substring(0, 64));
		const s = append0x(signature.substring(64));
		expect(verifySignature(hash, destination, append0x(Buffer.from(publicKey)), r, s)).to.be.true;
	});
});
