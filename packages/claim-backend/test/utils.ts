import { Leaf, Signature } from '../src/utils/interface';
import { address, utils } from '@liskhq/lisk-cryptography';

export const randomPublicKeyBuffer = () => utils.getRandomBytes(32);

export const randomHash = () => '0x' + randomPublicKeyBuffer().toString('hex');

export const randomLskAddress = () =>
	address.getLisk32AddressFromPublicKey(randomPublicKeyBuffer());

export const buildMockLeaf = (leaf: Partial<Leaf>): Leaf => {
	const publicKey = randomPublicKeyBuffer();
	return {
		lskAddress: leaf.lskAddress ?? address.getLisk32AddressFromPublicKey(publicKey),
		address: leaf.address ?? '0x' + address.getAddressFromPublicKey(publicKey).toString('hex'),
		balanceBeddows: leaf.balanceBeddows ?? Math.floor(Math.random() * 10000).toString(),
		numberOfSignatures: leaf.numberOfSignatures ?? 0,
		mandatoryKeys: leaf.mandatoryKeys ?? [],
		optionalKeys: leaf.optionalKeys ?? [],
		hash: leaf.hash ?? randomHash(),
		proof: leaf.proof ?? [randomHash()],
	};
};

export const buildMockSignature = (signature: Partial<Signature>): Signature => {
	const publicKey = randomPublicKeyBuffer();
	return {
		lskAddress: signature.lskAddress ?? address.getLisk32AddressFromPublicKey(publicKey),
		destination: signature.destination ?? '0x34A1D3fff3958843C43aD80F30b94c510645C316',
		signer: signature.signer ?? publicKey.toString('hex'),
		isOptional: signature.isOptional ?? false,
		r: signature.r ?? randomHash(),
		s: signature.s ?? randomHash(),
	};
};
