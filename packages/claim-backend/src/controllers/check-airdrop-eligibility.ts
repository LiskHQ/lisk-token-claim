import { address } from '@liskhq/lisk-cryptography';
import { getAirdropLeafMap } from '../utils/leaf-map';
import { ErrorCode } from '../utils/error';

export function checkAirdropEligibility({ lskAddress }: { lskAddress: string }) {
	try {
		address.validateLisk32Address(lskAddress);
	} catch (err) {
		throw new Error(ErrorCode.INVALID_LSK_ADDRESS);
	}

	const leaf = getAirdropLeafMap(lskAddress);

	return {
		account: leaf,
	};
}
