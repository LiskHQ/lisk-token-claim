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
		multisigAccounts.length > 0 || (account?.numberOfSignatures && account?.numberOfSignatures > 0)
			? await Signature.findAll({
					attributes: ['lskAddress', 'destination', 'signer', 'r', 's'],
					where: {
						lskAddress: {
							[Op.in]: multisigAccounts
								.map(account => account.lskAddress)
								.concat(account?.lskAddress ? [account.lskAddress] : []),
						},
					},
					raw: true,
				})
			: [];

	const numberOfSignaturesGroupByLskAddressAndDestination = signatures.reduce(
		(obj: { [lskAddress: string]: { [destination: string]: number } }, signature) => {
			if (!obj[signature.lskAddress]) {
				obj[signature.lskAddress] = {};
			}
			if (!obj[signature.lskAddress][signature.destination]) {
				obj[signature.lskAddress][signature.destination] = 0;
			}
			obj[signature.lskAddress][signature.destination]++;
			return obj;
		},
		{},
	);

	const accountWithReadyFlag = account
		? account.numberOfSignatures > 0
			? {
					...account,
					ready: numberOfSignaturesGroupByLskAddressAndDestination[account.lskAddress]
						? Math.max(
								...Object.values(
									numberOfSignaturesGroupByLskAddressAndDestination[account.lskAddress],
								),
							) === account.numberOfSignatures
						: false,
				}
			: account
		: null;

	const multisigAccountsWithReadyFlag = multisigAccounts.map(account => ({
		...account,
		ready: numberOfSignaturesGroupByLskAddressAndDestination[account.lskAddress]
			? Math.max(
					...Object.values(numberOfSignaturesGroupByLskAddressAndDestination[account.lskAddress]),
				) === account.numberOfSignatures
			: false,
	}));

	return Promise.resolve({
		account: accountWithReadyFlag,
		multisigAccounts: multisigAccountsWithReadyFlag,
		signatures,
	});
}
