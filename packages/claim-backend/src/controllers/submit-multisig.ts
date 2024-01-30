import { Request, Response } from 'express';
import { ethers } from 'ethers';
import Signature from '../models/Signature.model';
import { getLeafMap } from '../utils/leaf-map';
import { httpError, ErrorCode } from '../utils/error';
import { verifySignature } from '../utils/verify-signature';

export async function submitMultisig(req: Request, res: Response) {
	const { lskAddress, destination, publicKey, r, s } = req.body;

	const leaf = getLeafMap(lskAddress);
	if (!leaf || leaf.numberOfSignatures === 0) {
		httpError(
			res,
			400,
			ErrorCode.INVALID_LSK_ADDRESS,
			`'${lskAddress}' is not a valid Multisig address`,
		);
		return;
	}

	if (!ethers.isAddress(destination)) {
		httpError(
			res,
			400,
			ErrorCode.INVALID_DESTINATION_ADDRESS,
			`'${destination}' is not a valid ETH address`,
		);
		return;
	}

	const publicKeyIndex = leaf.mandatoryKeys.concat(leaf.optionalKeys).indexOf(publicKey);
	if (publicKeyIndex < 0) {
		httpError(
			res,
			400,
			ErrorCode.PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS,
			`'${publicKey}' does not own '${lskAddress}'`,
		);
		return;
	}

	let isOptional = false;
	if (publicKeyIndex >= leaf.mandatoryKeys.length) {
		isOptional = true;
		const signedOptionalKeyCount = await Signature.count({
			where: {
				address: lskAddress,
				destination: destination.toLowerCase(),
			},
		});
		if (signedOptionalKeyCount === leaf.numberOfSignatures - leaf.mandatoryKeys.length) {
			httpError(
				res,
				400,
				ErrorCode.NUMBER_OF_SIGNATURES_REACHED,
				'Number of Signatures has reached',
			);
			return;
		}
	}

	if (!verifySignature(leaf.hash, destination, publicKey, r, s)) {
		httpError(res, 400, ErrorCode.INVALID_SIGNATURE, 'Invalid Signature');
		return;
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
			httpError(
				res,
				400,
				ErrorCode.ALREADY_SIGNED,
				`'${lskAddress}-${destination}-${publicKey}' has been signed`,
			);
			return;
		}
		httpError(res, 500, ErrorCode.UNKNOWN_ERROR, '');
		return;
	}

	res.json({
		ok: true,
	});
}
