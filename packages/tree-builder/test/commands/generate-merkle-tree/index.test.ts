import { expect, test } from '@oclif/test';
import { Database } from '@liskhq/lisk-db';
import * as path from 'path';
import * as fs from 'fs';
import { TOKEN_PREFIX } from '../../../src/constants';
import { codec } from '@liskhq/lisk-codec';
import { userBalanceSchema } from '../../../src/applications/generate-merkle-tree/schema';
import { utils } from '@liskhq/lisk-cryptography';

describe('GenerateMerkleTree', () => {
	const dataPath = './test/data';
	const stateDBPath = path.join(dataPath, 'state.db');

	before(async () => {
		// Create DB before each test
		const db = new Database(stateDBPath);
		await db.set(
			Buffer.concat([
				TOKEN_PREFIX,
				utils.getRandomBytes(20),
				Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0]),
			]),
			codec.encode(userBalanceSchema, {
				availableBalance: BigInt(Math.floor(Math.random() * 10000)),
				lockedBalances: [],
			}),
		);
		db.close();
	});

	after(() => {
		// Remove DB after each test
		fs.rmSync(stateDBPath, { recursive: true, force: true });
	});

	test
		.loadConfig({ root: __dirname })
		.command(['generate-merkle-tree'])
		.catch(err => expect(err.message).to.contain('Missing required flag dbPath'))
		.it('should reject when dbPath not provided');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['generate-merkle-tree', `--dbPath=${dataPath}`, '--tokenId=0000'])
		.catch(err => expect(err.message).to.contain('tokenId length be in 8 bytes'))
		.it('should reject when tokenId has invalid length');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['generate-merkle-tree', `--dbPath=${dataPath}`])
		.it('should warn 0 account for empty DB', ctx => {
			expect(ctx.stdout).to.contain('DB has 0 accounts, check tokenId or local chain status');
		});
});
