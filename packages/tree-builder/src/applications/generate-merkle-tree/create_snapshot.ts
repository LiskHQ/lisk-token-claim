import { StateDB } from '@liskhq/lisk-db';
import { codec } from '@liskhq/lisk-codec';
import { utils, address } from '@liskhq/lisk-cryptography';
import * as fs from 'fs';
import {
  authAccountSchema,
  getBalanceResponseSchema,
} from './schema';
import {Account, AuthAccount, UserBalance} from "../../interface";

const ADDRESS_LENGTH = 20;
const ITERATE_LIMIT = 100000;
const LSK_TOKEN_ID = Buffer.alloc(8, 0);

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
          latestProcessedAddress = key.subarray(prefixBuffer.length, ADDRESS_LENGTH + prefixBuffer.length);
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

// LIP: https://github.com/LiskHQ/lips/blob/main/proposals/lip-0040.md#module-store-prefix-1
export const computeStorePrefix = (name: string): Buffer => {
  const prefix = utils.hash(Buffer.from(name, 'utf-8')).subarray(0, 4);
  // eslint-disable-next-line no-bitwise
  prefix[0] &= 0x7f;
  return prefix;
};

function getTotalBalance(balance: UserBalance): bigint {
  return (
    balance.availableBalance +
    balance.lockedBalances.reduce((acc, cur) => acc + cur.amount, BigInt(0))
  );
}

function bufferArrayToHexStringArray(array: Buffer[]): string[] {
  return array.map(element => element.toString('hex'));
}

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

export async function createSnapshot(
  dbPath: string
): Promise<Account[]> {
  const rdb = new StateDB(dbPath, { readonly: true });

  const accountMap: {
    [address: string]: Account
  } = {};

  // Process Balance, moduleName = "token", index = 0
  await iterate(
    rdb,
    Buffer.concat([computeStorePrefix("token"), Buffer.alloc(2, 0)]),
    LSK_TOKEN_ID,
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
      if (key.subarray(6 + ADDRESS_LENGTH).compare(LSK_TOKEN_ID) !== 0) {
        return;
      }
      const balance = codec.decode<UserBalance>(getBalanceResponseSchema, value);
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

  // Process Multisig Addresses, moduleName = "auth", index = 0
  await iterate(
    rdb,
    Buffer.concat([computeStorePrefix("auth"), Buffer.alloc(2, 0)]),
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

  fs.writeFileSync('result.json', JSON.stringify(Object.values(accountMap)), 'utf-8');
  rdb.close();

  return Object.values(accountMap);
}