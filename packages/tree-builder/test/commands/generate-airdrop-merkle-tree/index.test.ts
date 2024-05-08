import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { expect, test } from '@oclif/test';
import { StateDB } from '@liskhq/lisk-db';
import { utils, address } from '@liskhq/lisk-cryptography';
import { codec } from '@liskhq/lisk-codec';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { TOKEN_PREFIX } from '../../../src/constants';
import { userBalanceSchema } from '../../../src/applications/generate-merkle-tree/schema';
import * as generateAirdropMerkleTree from '../../../src/applications/generate-airdrop-merkle-tree';
import { lskToBeddows } from '../../../src/utils';

describe('GenerateAirdropMerkleTree', () => {
	const dataPath = os.tmpdir();
	const stateDBPath = path.join(dataPath, 'state.db');
	const tokenId = Buffer.from('0000000000000000', 'hex');
	let sandbox: SinonSandbox;
	let applyAirdropStub: SinonStub;

	// Figures differ from default are used to validate configurability
	const cutOff = lskToBeddows(100);
	const whaleCap = lskToBeddows(500000);
	const airdropPercent = BigInt(15);
	const excludedAddresses = [address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32))];

	const pubKeyHash = utils.getRandomBytes(20);
	const account = {
		lskAddress: address.getLisk32AddressFromAddress(pubKeyHash),
		balanceBeddows: lskToBeddows(Math.floor(Math.random() * 100)) + cutOff,
	};

	beforeEach(async () => {
		sandbox = createSandbox();
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
		.command(['generate-airdrop-merkle-tree'])
		.catch(err => expect(err.message).to.contain('Missing required flag db-path'))
		.it('should reject when dbPath not provided');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command([
			'generate-airdrop-merkle-tree',
			`--output-path=${dataPath}`,
			`--db-path=${dataPath}`,
			'--token-id=0000',
		])
		.catch(err => expect(err.message).to.contain('token-id length be in 8 bytes'))
		.it('should reject when token-id has invalid length');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['generate-airdrop-merkle-tree', `--output-path=${dataPath}`, `--db-path=${dataPath}`])
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
					availableBalance: account.balanceBeddows,
					lockedBalances: [],
				}),
			);

			await db.commit(writer, 0, Buffer.alloc(0));
			writer.close();
			db.close();
		})
		.command([
			'generate-airdrop-merkle-tree',
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
				Buffer.concat([TOKEN_PREFIX, pubKeyHash, tokenId]),
				codec.encode(userBalanceSchema, {
					availableBalance: account.balanceBeddows,
					lockedBalances: [],
				}),
			);

			await db.commit(writer, 0, Buffer.alloc(0));
			writer.close();
			db.close();

			// Stub applyAirdrop
			applyAirdropStub = sandbox.stub(generateAirdropMerkleTree, 'applyAirdrop');

			// Create excludedAddress file
			await fs.promises.writeFile(
				`${dataPath}/excluded-address`,
				excludedAddresses.join('\n'),
				'utf-8',
			);
		})
		.command([
			'generate-airdrop-merkle-tree',
			`--output-path=${dataPath}`,
			`--db-path=${dataPath}`,
			`--cutoff=${cutOff}`,
			`--whale-cap=${whaleCap}`,
			`--airdrop-percent=${airdropPercent}`,
			`--excluded-addresses-path=${dataPath}/excluded-address`,
		])
		.it('should call applyAirdrop with correct params', () => {
			expect(
				applyAirdropStub.calledWith(
					[
						{
							lskAddress: account.lskAddress,
							balanceBeddows: account.balanceBeddows.toString(),
						},
					],
					lskToBeddows(cutOff),
					lskToBeddows(whaleCap),
					airdropPercent,
					excludedAddresses,
				),
			).to.be.true;
		});
});
