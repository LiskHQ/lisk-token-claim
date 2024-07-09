import * as tweetnacl from 'tweetnacl';
import { AbiCoder, keccak256 } from 'ethers';

import { append0x, BYTES_9, signMessage } from '../../src/utils';

const abiCoder = new AbiCoder();

describe('signMessage', () => {
	it('should sign message and able to verify signer', () => {
		const hash = append0x(new Array(64).fill('e').join(''));
		const destinationAddress = append0x(new Array(40).fill('e').join(''));
		const { publicKey, secretKey: privateKey } = tweetnacl.sign.keyPair();

		const message =
			keccak256(abiCoder.encode(['bytes32', 'address'], [hash, destinationAddress])) + BYTES_9;

		const signedMessage = signMessage(hash, destinationAddress, Buffer.from(privateKey));

		tweetnacl.sign.detached.verify(
			Buffer.from(message, 'hex'),
			Buffer.from(signedMessage, 'hex'),
			publicKey,
		);
	});
});
