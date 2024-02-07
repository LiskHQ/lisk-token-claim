import { Op } from 'sequelize';
import { address } from '@liskhq/lisk-cryptography';
import { getLeafMap, getMultisigMap } from '../utils/leaf-map';
import { ErrorCode } from '../utils/error';
import Signature from '../models/signature.model';
import { Leaf } from '../interface';

const checkReady = (
	numberOfSignaturesGroupByLskAddressAndDestination: {
		[lskAddress: string]: { [destination: string]: number };
	},
	leaf: Leaf,
): boolean => {
	return numberOfSignaturesGroupByLskAddressAndDestination[leaf.lskAddress]
		? Math.max(
				...Object.values(numberOfSignaturesGroupByLskAddressAndDestination[leaf.lskAddress]),
			) === leaf.numberOfSignatures
		: false;
};

export async function checkEligibility({ lskAddress }: { lskAddress: string }) {
	try {
		address.validateLisk32Address(lskAddress);
	} catch (err) {
		throw new Error(ErrorCode.INVALID_LSK_ADDRESS);
	}

	const leaf = getLeafMap(lskAddress);
	const multisigAccounts = getMultisigMap(lskAddress);

	const signatures =
		multisigAccounts.length > 0 || (leaf?.numberOfSignatures && leaf?.numberOfSignatures > 0)
			? await Signature.findAll({
					attributes: ['lskAddress', 'destination', 'signer', 'r', 's'],
					where: {
						lskAddress: {
							[Op.in]: multisigAccounts
								.map(account => account.lskAddress)
								.concat(leaf?.lskAddress ? [leaf.lskAddress] : []),
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

	const accountWithReadyFlag = leaf
		? leaf.numberOfSignatures > 0
			? {
					...leaf,
					ready: checkReady(numberOfSignaturesGroupByLskAddressAndDestination, leaf),
				}
			: leaf
		: null;

	const multisigAccountsWithReadyFlag = multisigAccounts.map(account => ({
		...account,
		ready: checkReady(numberOfSignaturesGroupByLskAddressAndDestination, account),
	}));

	return {
		account: accountWithReadyFlag,
		multisigAccounts: multisigAccountsWithReadyFlag,
		signatures,
	};
}
