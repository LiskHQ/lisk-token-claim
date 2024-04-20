import { AirdropLeaf, Leaf, Signature } from '../src/interface';
import { address, utils } from '@liskhq/lisk-cryptography';
import { append0x } from '../src/utils';
import { ethers } from 'ethers';

export const randomBuffer = (length: number) => utils.getRandomBytes(length);

export const randomPublicKeyBuffer = () => randomBuffer(32);

export const randomHash = () => append0x(randomBuffer(32));

export const randomEthAddress = () => ethers.getAddress(append0x(randomBuffer(20)));

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

export const buildMockAirdropLeaf = (leaf: Partial<AirdropLeaf>): AirdropLeaf => {
	const publicKey = randomPublicKeyBuffer();
	return {
		lskAddress: leaf.lskAddress ?? address.getLisk32AddressFromPublicKey(publicKey),
		address: leaf.address ?? '0x' + address.getAddressFromPublicKey(publicKey).toString('hex'),
		balanceWei: leaf.balanceWei ?? Math.floor(Math.random() * 10000).toString(),
		hash: leaf.hash ?? randomHash(),
		proof: leaf.proof ?? [randomHash()],
	};
};

export const buildMockSignature = (signature: Partial<Signature>): Signature => {
	const publicKey = randomPublicKeyBuffer();
	return {
		lskAddress: signature.lskAddress ?? address.getLisk32AddressFromPublicKey(publicKey),
		destination: signature.destination ?? randomEthAddress(),
		signer: signature.signer ?? publicKey.toString('hex'),
		isOptional: signature.isOptional ?? false,
		r: signature.r ?? randomHash(),
		s: signature.s ?? randomHash(),
	};
};
