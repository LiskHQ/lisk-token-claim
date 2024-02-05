import { StateDB } from '@liskhq/lisk-db';
import { codec } from '@liskhq/lisk-codec';
import { address } from '@liskhq/lisk-cryptography';
import { authAccountSchema, userBalanceSchema } from './schema';
import { Account, AuthAccount, UserBalance } from '../../interface';
import { bufferArrayToHexStringArray, getTotalBalance } from '../../utils';
import { AUTH_PREFIX, TOKEN_PREFIX } from '../../constants';

const ADDRESS_LENGTH = 20;
const ITERATE_LIMIT = 100000;

function incrementBufferWithOverflow(inputBuffer: Buffer): Buffer {
	const bufferCopy = Buffer.from(inputBuffer);
	const lastIndex = bufferCopy.length - 1;

	// Increment the rightmost byte
	bufferCopy[lastIndex] += 1;

	// Check for overflow
	if (bufferCopy[lastIndex] === 0) {
		// Overflow occurred, increment the left side
		for (let i = lastIndex - 1; i >= 0; i--) {
			bufferCopy[i] += 1;
			if (bufferCopy[i] !== 0) {
				// No further overflow, break the loop
				break;
			}
		}
	}
	return bufferCopy;
}

async function iterate(
	rdb: StateDB,
	prefixBuffer: Buffer,
	postfixBuffer: Buffer,
	dataCallbackFn: ({
		key,
		value,
		latestProcessedAddress,
	}: {
		key: Buffer;
		value: Buffer;
		latestProcessedAddress: Buffer;
	}) => void,
) {
	let start = Buffer.alloc(ADDRESS_LENGTH, 0);
	let lastProcessedAddress: Buffer;
	do {
		const stream = rdb.iterate({
			gte: Buffer.concat([prefixBuffer, start, postfixBuffer]),
			lte: Buffer.concat([prefixBuffer, Buffer.alloc(ADDRESS_LENGTH, 255), postfixBuffer]),
			limit: ITERATE_LIMIT,
		});

		lastProcessedAddress = await new Promise<Buffer>((resolve, reject) => {
			let latestProcessedAddress: Buffer;
			stream
				.on('data', ({ key, value }: { key: Buffer; value: Buffer }) => {
					latestProcessedAddress = key.subarray(
						prefixBuffer.length,
						ADDRESS_LENGTH + prefixBuffer.length,
					);
					dataCallbackFn({ key, value, latestProcessedAddress });
				})
				.on('error', error => {
					reject(error);
				})
				.on('end', () => {
					resolve(latestProcessedAddress);
				});
		});
		if (!lastProcessedAddress) {
			break;
		}
		start = incrementBufferWithOverflow(lastProcessedAddress);
	} while (lastProcessedAddress);
}

export async function createSnapshot(db: StateDB, tokenId: Buffer): Promise<Account[]> {
	const accountMap: {
		[address: string]: Account;
	} = {};

	// Process Balance
	await iterate(
		db,
		TOKEN_PREFIX,
		tokenId,
		({
			key,
			value,
			latestProcessedAddress,
		}: {
			key: Buffer;
			value: Buffer;
			latestProcessedAddress: Buffer;
		}) => {
			// Ignore non-LSK Token
			if (key.subarray(TOKEN_PREFIX.length + ADDRESS_LENGTH).compare(tokenId) !== 0) {
				return;
			}
			const balance = codec.decode<UserBalance>(userBalanceSchema, value);
			const totalBalance = getTotalBalance(balance);
			if (totalBalance > BigInt(0)) {
				const lskAddress = address.getLisk32AddressFromAddress(latestProcessedAddress);
				accountMap[lskAddress] = {
					lskAddress: lskAddress,
					balanceBeddows: totalBalance.toString(),
				};
			}
		},
	);

	// Process Multisig Addresses,
	await iterate(
		db,
		AUTH_PREFIX,
		Buffer.from([]),
		({
			value,
			latestProcessedAddress,
		}: {
			key: Buffer;
			value: Buffer;
			latestProcessedAddress: Buffer;
		}) => {
			const authAccount = codec.decode<AuthAccount>(authAccountSchema, value);
			if (authAccount.numberOfSignatures > 0) {
				const lskAddress = address.getLisk32AddressFromAddress(latestProcessedAddress);

				// Only take care LSK balance > 0
				if (accountMap[lskAddress]) {
					accountMap[lskAddress] = {
						...accountMap[lskAddress],
						numberOfSignatures: authAccount.numberOfSignatures,
						mandatoryKeys: bufferArrayToHexStringArray(authAccount.mandatoryKeys),
						optionalKeys: bufferArrayToHexStringArray(authAccount.optionalKeys),
					};
				}
			}
		},
	);

	return Object.values(accountMap);
}
