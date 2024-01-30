import { Request, Response } from 'express';
import { getLeafMap, getMultisigMap } from '../utils/leaf-map';
import { ErrorCode, httpError } from '../utils/error';
import Signature from '../models/Signature.model';
import { Op } from 'sequelize';
import { address } from '@liskhq/lisk-cryptography';

export async function check(req: Request, res: Response) {
	const { lskAddress } = req.params;

	try {
		address.validateLisk32Address(lskAddress);
	} catch (err) {
		httpError(res, 400, ErrorCode.INVALID_LSK_ADDRESS, `'${lskAddress}' is not a valid address.`);
		return;
	}

	const account = getLeafMap(lskAddress);
	const multisigAccounts = getMultisigMap(lskAddress);

	const signatures = multisigAccounts
		? await Signature.findAll({
				attributes: ['lskAddress', 'destination', 'signer', 'r', 's'],
				where: {
					lskAddress: {
						[Op.in]: multisigAccounts.map(account => account.lskAddress),
					},
				},
				raw: true,
			})
		: [];

	res.json({
		account,
		multisigAccounts,
		signatures,
	});
}
