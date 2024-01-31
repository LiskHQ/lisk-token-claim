import { ethers } from 'ethers';
import Signature from '../models/Signature.model';
import { getLeafMap } from '../utils/leaf-map';
import { ErrorCode } from '../utils/error';
import { verifySignature } from '../utils/verify-signature';

export async function submitMultisig({
	lskAddress,
	destination,
	publicKey,
	r,
	s,
}: {
	lskAddress: string;
	destination: string;
	publicKey: string;
	r: string;
	s: string;
}) {
	const leaf = getLeafMap(lskAddress);
	if (!leaf || leaf.numberOfSignatures === 0) {
		return Promise.reject(new Error(ErrorCode.INVALID_LSK_ADDRESS));
	}

	if (!ethers.isAddress(destination)) {
		return Promise.reject(new Error(ErrorCode.INVALID_DESTINATION_ADDRESS));
	}

	const publicKeyIndex = leaf.mandatoryKeys.concat(leaf.optionalKeys).indexOf(publicKey);
	if (publicKeyIndex < 0) {
		return Promise.reject(new Error(ErrorCode.PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS));
	}

	let isOptional = false;
	if (publicKeyIndex >= leaf.mandatoryKeys.length) {
		isOptional = true;
		const signedOptionalKeyCount = await Signature.count({
			where: {
				lskAddress,
				destination: destination.toLowerCase(),
				isOptional,
			},
		});
		if (signedOptionalKeyCount === leaf.numberOfSignatures - leaf.mandatoryKeys.length) {
			return Promise.reject(new Error(ErrorCode.NUMBER_OF_SIGNATURES_REACHED));
		}
	}

	if (!verifySignature(leaf.hash, destination, publicKey, r, s)) {
		return Promise.reject(new Error(ErrorCode.INVALID_SIGNATURE));
	}

	try {
		await Signature.create({
			lskAddress,
			destination,
			signer: publicKey,
			isOptional,
			r,
			s,
		});
	} catch (err: unknown) {
		if (err instanceof Error && err.name === 'SequelizeUniqueConstraintError') {
			return Promise.reject(new Error(ErrorCode.ALREADY_SIGNED));
		}
		return Promise.reject(new Error(ErrorCode.UNKNOWN_ERROR));
	}

	const numberOfSignatures = await Signature.count({
		where: {
			lskAddress,
			destination: destination.toLowerCase(),
		},
	});
	return Promise.resolve({
		success: true,
		ready: numberOfSignatures === leaf.numberOfSignatures,
	});
}
