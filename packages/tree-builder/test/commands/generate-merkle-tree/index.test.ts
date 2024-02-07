import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { expect, test } from '@oclif/test';
import { StateDB } from '@liskhq/lisk-db';
import { utils } from '@liskhq/lisk-cryptography';
import { codec } from '@liskhq/lisk-codec';
import { TOKEN_PREFIX } from '../../../src/constants';
import { userBalanceSchema } from '../../../src/applications/generate-merkle-tree/schema';

describe('GenerateMerkleTree', () => {
	const dataPath = os.tmpdir();
	const stateDBPath = path.join(dataPath, 'state.db');
	const tokenId = Buffer.from('0000000000000000', 'hex');

	beforeEach(async () => {
		// Create Empty DB before each test
		const db = new StateDB(stateDBPath);
		db.close();
	});

	afterEach(() => {
		// Remove DB after each test
		fs.rmSync(stateDBPath, { recursive: true, force: true });
	});

	test
		.loadConfig({ root: __dirname })
		.command(['generate-merkle-tree'])
		.catch(err => expect(err.message).to.contain('Missing required flag db-path'))
		.it('should reject when dbPath not provided');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command([
			'generate-merkle-tree',
			`--output-path=${dataPath}`,
			`--db-path=${dataPath}`,
			'--token-id=0000',
		])
		.catch(err => expect(err.message).to.contain('token-id length be in 8 bytes'))
		.it('should reject when token-id has invalid length');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['generate-merkle-tree', `--output-path=${dataPath}`, `--db-path=${dataPath}`])
		.it('should warn 0 account for empty DB', ctx => {
			expect(ctx.stdout).to.contain('DB has 0 accounts, check token-id or local chain status');
		});

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.do(async () => {
			const db = new StateDB(stateDBPath);
			const writer = db.newReadWriter();

			await writer.set(
				Buffer.concat([TOKEN_PREFIX, utils.getRandomBytes(20), tokenId]),
				codec.encode(userBalanceSchema, {
					availableBalance: BigInt(Math.floor(Math.random() * 10000)),
					lockedBalances: [],
				}),
			);

			await db.commit(writer, 0, Buffer.alloc(0));
			writer.close();
			db.close();
		})
		.command([
			'generate-merkle-tree',
			`--output-path=${dataPath}`,
			`--db-path=${dataPath}`,
			'--token-id=0000000000000001',
		])
		.it('should warn 0 account for incorrect token-id', ctx => {
			expect(ctx.stdout).to.contain('DB has 0 accounts, check token-id or local chain status');
		});

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.do(async () => {
			const db = new StateDB(stateDBPath);
			const writer = db.newReadWriter();

			await writer.set(
				Buffer.concat([TOKEN_PREFIX, utils.getRandomBytes(20), tokenId]),
				codec.encode(userBalanceSchema, {
					availableBalance: BigInt(Math.floor(Math.random() * 10000)),
					lockedBalances: [],
				}),
			);

			await db.commit(writer, 0, Buffer.alloc(0));
			writer.close();
			db.close();
		})
		.command(['generate-merkle-tree', `--output-path=${dataPath}`, `--db-path=${dataPath}`])
		.it('should process 1 account', ctx => {
			expect(ctx.stdout).to.contain('1 Accounts to generate');
		});
});
