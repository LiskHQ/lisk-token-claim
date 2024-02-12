import { ethers } from 'ethers';
import Signature from '../models/signature.model';
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
		throw new Error(ErrorCode.INVALID_LSK_ADDRESS);
	}

	if (!ethers.isAddress(destination)) {
		throw new Error(ErrorCode.INVALID_DESTINATION_ADDRESS);
	}
	destination = ethers.getAddress(destination);
	publicKey = publicKey.toLowerCase();

	const publicKeyIndex = leaf.mandatoryKeys.concat(leaf.optionalKeys).indexOf(publicKey);
	if (publicKeyIndex < 0) {
		throw new Error(ErrorCode.PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS);
	}

	let isOptional = false;
	if (publicKeyIndex >= leaf.mandatoryKeys.length) {
		isOptional = true;
		const signedOptionalKeyCount = await Signature.count({
			where: {
				lskAddress,
				destination,
				isOptional,
			},
		});
		if (signedOptionalKeyCount === leaf.numberOfSignatures - leaf.mandatoryKeys.length) {
			throw new Error(ErrorCode.NUMBER_OF_SIGNATURES_REACHED);
		}
	}

	if (!verifySignature(leaf.hash, destination, publicKey, r, s)) {
		throw new Error(ErrorCode.INVALID_SIGNATURE);
	}

	const existingSignature = await Signature.findOne({
		where: {
			lskAddress,
			signer: publicKey,
		},
	});

	if (existingSignature) {
		if (existingSignature.destination === destination) {
			throw new Error(ErrorCode.ALREADY_SIGNED);
		}

		await Signature.update(
			{
				destination,
				r,
				s,
			},
			{
				where: {
					lskAddress,
					signer: publicKey,
				},
				individualHooks: true,
			},
		);
	} else {
		await Signature.create({
			lskAddress,
			destination,
			signer: publicKey,
			isOptional,
			r,
			s,
		});
	}

	const numberOfSignatures = await Signature.count({
		where: {
			lskAddress,
			destination,
		},
	});
	return {
		success: true,
		ready: numberOfSignatures === leaf.numberOfSignatures,
	};
}
