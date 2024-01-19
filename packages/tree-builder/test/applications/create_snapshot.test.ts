import * as os from 'os';
import * as path from 'path';
import fs from 'fs';
import { utils } from '@liskhq/lisk-cryptography';
import { StateDB } from '@liskhq/lisk-db';
import { codec } from '@liskhq/lisk-codec';
import { expect } from 'chai';
import { createSnapshot } from '../../src/applications/generate-merkle-tree/create_snapshot';
import {
	authAccountSchema,
	userBalanceSchema,
} from '../../src/applications/generate-merkle-tree/schema';
import { bufferArrayToHexStringArray, getTotalBalance } from '../../src/utils';
import { AUTH_PREFIX, TOKEN_PREFIX } from '../../src/constants';

const randomBalance = () => BigInt(Math.floor(Math.random() * 10000));

describe('createSnapshot', () => {
	const dataPath = os.tmpdir();
	const stateDBPath = path.join(dataPath, 'state.db');
	const db = new StateDB(stateDBPath);
	const writer = db.newReadWriter();

	const numOfAccounts = 5;
	const tokenId = Buffer.from([4, 0, 0, 0, 0, 0, 0, 0, 0]);

	const mockAuthAccount = {
		nonce: 5,
		numberOfSignatures: 2,
		mandatoryKeys: [utils.getRandomBytes(32)],
		optionalKeys: [utils.getRandomBytes(32), utils.getRandomBytes(32)],
	};

	// Create random, sorted accounts with balances
	const randomAccounts = [...Array(numOfAccounts).keys()]
		.map(index => ({
			address: utils.getRandomBytes(20),
			balance: {
				availableBalance: randomBalance(),

				// index = 0 has no lockedBalances, index = 1 has one element of lockedBalance, and so on.
				lockedBalances: [...Array(index).keys()].map(index => ({
					module: index.toString(),
					amount: randomBalance(),
				})),
			},
		}))
		.sort((a, b) => a.address.compare(b.address));
	const totalLSKBalance = randomAccounts.reduce(
		(acc, account) => acc + getTotalBalance(account.balance),
		BigInt(0),
	);

	before(async () => {
		// Insert LSK balances into DB
		for (const account of randomAccounts) {
			await writer.set(
				Buffer.concat([TOKEN_PREFIX, account.address, tokenId]),
				codec.encode(userBalanceSchema, account.balance),
			);
		}

		// Insert balance with non-relevant token into DB
		await writer.set(
			Buffer.concat([
				TOKEN_PREFIX,
				randomAccounts[0].address,
				Buffer.from([4, 0, 0, 0, 0, 0, 0, 0, 1]),
			]),
			codec.encode(userBalanceSchema, {
				balance: randomBalance(),
				lockedBalances: [
					{
						module: 'foobar',
						amount: randomBalance(),
					},
				],
			}),
		);

		// Insert Multisig into one of the account
		await writer.set(
			Buffer.concat([AUTH_PREFIX, randomAccounts[0].address]),
			codec.encode(authAccountSchema, mockAuthAccount),
		);

		// Commit to DB
		await db.commit(writer, 0, Buffer.alloc(0));
	});

	after(() => {
		// Close and remove DB
		writer.close();
		db.close();
		fs.rmSync(stateDBPath, { recursive: true, force: true });
	});

	it('should create snapshot from DB', async () => {
		const accounts = await createSnapshot(db, tokenId);

		let totalLSKBalancesInDB = BigInt(0);
		// Verify BalanceBeddows = availableBalance + lockedBalances
		for (const [index, account] of randomAccounts.entries()) {
			const totalBalance = getTotalBalance(account.balance);
			expect(totalBalance.toString()).equal(accounts[index].balanceBeddows);

			totalLSKBalancesInDB += totalBalance;
		}

		// Verify only LSK Balances are considered
		expect(totalLSKBalancesInDB).equal(totalLSKBalance);

		// Verify Multisig data is recorded
		expect(accounts[0].numberOfSignatures).equal(mockAuthAccount.numberOfSignatures);
		expect(accounts[0].mandatoryKeys).deep.equal(
			bufferArrayToHexStringArray(mockAuthAccount.mandatoryKeys),
		);
		expect(accounts[0].optionalKeys).deep.equal(
			bufferArrayToHexStringArray(mockAuthAccount.optionalKeys),
		);
	});
});
