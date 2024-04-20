import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { address, utils } from '@liskhq/lisk-cryptography';
import { UserBalance } from './interface';

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

// When bytes = 8, max value = 2 ** (8 * 8) - 1
export function randomBalanceBeddows(maxBytes = 8): string {
	return BigInt(append0x(utils.getRandomBytes(maxBytes))).toString();
}

export const lskToBeddows = (lskAmount: number | bigint | string): bigint => {
	return BigInt(lskAmount) * BigInt(10 ** 8);
};

export const beddowsToWei = (beddowsAmount: number | bigint | string): bigint => {
	return BigInt(beddowsAmount) * BigInt(10 ** 10);
};

export function readExcludedAddresses(excludedAddressesPath: string | undefined): string[] {
	if (excludedAddressesPath === undefined) {
		return [];
	}
	const resolvedPath = path.resolve(excludedAddressesPath.replace('~', os.homedir()));
	if (!fs.existsSync(resolvedPath)) {
		throw new Error(`${resolvedPath} does not exist`);
	}

	const excludedAddresses = fs.readFileSync(resolvedPath, 'utf-8').split('\n');

	for (const excludedAddress of excludedAddresses) {
		address.validateLisk32Address(excludedAddress);
	}
	return excludedAddresses;
}
