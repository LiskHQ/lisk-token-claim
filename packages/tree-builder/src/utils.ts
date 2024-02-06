import { utils } from '@liskhq/lisk-cryptography';
import BigNumber from 'bignumber.js';
import { UserBalance } from './interface';
import { LSK_MULTIPLIER } from './constants';

export function append0x(input: string | Buffer): string {
	if (input instanceof Buffer) {
		input = input.toString('hex');
	}
	if (input.substring(0, 2) === '0x') {
		return input;
	}
	return '0x' + input;
}

// LIP: https://github.com/LiskHQ/lips/blob/main/proposals/lip-0040.md#module-store-prefix-1
export function computeStorePrefix(name: string): Buffer {
	const prefix = utils.hash(Buffer.from(name, 'utf-8')).subarray(0, 4);
	// eslint-disable-next-line no-bitwise
	prefix[0] &= 0x7f;
	return prefix;
}

export function bufferArrayToHexStringArray(array: Buffer[]): string[] {
	return array.map(element => element.toString('hex'));
}

export function getTotalBalance(balance: UserBalance): bigint {
	return (
		balance.availableBalance +
		balance.lockedBalances.reduce((acc, cur) => acc + cur.amount, BigInt(0))
	);
}
export function multiplyBeddows(input: number): string {
	return new BigNumber(input).multipliedBy(LSK_MULTIPLIER).toString();
}
