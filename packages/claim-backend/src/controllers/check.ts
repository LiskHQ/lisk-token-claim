import { getLeafMap, getMultisigMap } from '../utils/leaf-map';
import { ErrorCode } from '../utils/error';
import Signature from '../models/Signature.model';
import { Op } from 'sequelize';
import { address } from '@liskhq/lisk-cryptography';

export async function check({ lskAddress }: { lskAddress: string }) {
	try {
		address.validateLisk32Address(lskAddress);
	} catch (err) {
		return Promise.reject(new Error(ErrorCode.INVALID_LSK_ADDRESS));
	}

	const account = getLeafMap(lskAddress);
	const multisigAccounts = getMultisigMap(lskAddress);

	const signatures =
		multisigAccounts.length > 0
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

	const multisigAccountsWithReadyFlag = multisigAccounts.map(account => {
		const numberOfSignatures = signatures.reduce((count, signature) => {
			if (signature.lskAddress === account.lskAddress) {
				count += 1;
			}
			return count;
		}, 0);
		return {
			...account,
			ready: numberOfSignatures === account.numberOfSignatures,
		};
	});

	return Promise.resolve({
		account,
		multisigAccounts: multisigAccountsWithReadyFlag,
		signatures,
	});
}
