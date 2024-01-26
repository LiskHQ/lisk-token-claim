import { Request, Response } from 'express';
import { leafMap, multisigMap } from '../utils/leafMap';
import { ErrorCode, httpError } from '../utils/error';
import { address } from '@liskhq/lisk-cryptography';
import Signature from '../models/Signature.model';
import { Op } from 'sequelize';

const pubKeyRegex = /^(0x)?[0-9a-zA-Z]{64}$/;

export async function check(req: Request, res: Response) {
	const { publicKey } = req.body;
	if (!pubKeyRegex.test(publicKey)) {
		httpError(res, 400, ErrorCode.INVALID_PUBKEY, `'${publicKey}' is not a valid pubKey.`);
		return;
	}

	const regularAccount =
		leafMap[
			address.getLisk32AddressFromPublicKey(Buffer.from(publicKey.replace(/0x/g, ''), 'hex'))
		];
	const multisigAccounts = multisigMap[publicKey];

	if (!regularAccount && !multisigAccounts) {
		httpError(res, 400, ErrorCode.NO_ELIGIBLE_CLAIM, `${publicKey} has no eligible claim.`);
		return;
	}

	const signatures = await Signature.findAll({
		attributes: ['lskAddress', 'destination', 'signer', 'r', 's'],
		where: {
			lskAddress: {
				[Op.in]: multisigAccounts.map(account => account.lskAddress),
			},
		},
		raw: true,
	});

	res.json({
		regularAccount,
		multisigAccounts,
		signatures,
	});
}
