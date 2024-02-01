import { expect } from 'chai';
import * as sinon from 'sinon';
import { utils } from '@liskhq/lisk-cryptography';
import { check } from '../../src/controllers/check';
import * as LeafMap from '../../src/utils/leaf-map';
import { buildMockLeaf, buildMockSignature, randomHash, randomLskAddress } from '../utils';
import Signature from '../../src/models/Signature.model';
import { ErrorCode } from '../../src/utils/error';

describe('check', () => {
	let getLeafMapStub: sinon.SinonStub;
	let getMultisigMapStub: sinon.SinonStub;
	let signatureFindAllStub: sinon.SinonStub;

	beforeEach(() => {
		getLeafMapStub = sinon.stub(LeafMap, 'getLeafMap');
		getMultisigMapStub = sinon.stub(LeafMap, 'getMultisigMap');
		signatureFindAllStub = sinon.stub(Signature, 'findAll').returns(Promise.resolve([]));
	});

	afterEach(() => {
		getLeafMapStub.restore();
		getMultisigMapStub.restore();
		signatureFindAllStub.restore();
	});

	it('should return error when address is not valid', async () => {
		const lskAddress = 'foobar';
		try {
			await check({ lskAddress });
		} catch (err: unknown) {
			expect(err instanceof Error && err.message).to.eq(ErrorCode.INVALID_LSK_ADDRESS);
		}
	});

	it('should return success with empty result when address is not in leafMap or multisigMap, ie. not eligible', async () => {
		const lskAddress = randomLskAddress();
		getLeafMapStub.returns(null);
		getMultisigMapStub.returns([]);

		const result = await check({ lskAddress });
		expect(result).to.deep.equal({
			account: null,
			multisigAccounts: [],
			signatures: [],
		});
	});

	it('should return success for address with eligible regular address claim', async () => {
		const lskAddress = randomLskAddress();
		const leaf = buildMockLeaf({});
		getLeafMapStub.returns(leaf);
		getMultisigMapStub.returns([]);

		const result = await check({ lskAddress });
		expect(result).to.deep.equal({
			account: leaf,
			multisigAccounts: [],
			signatures: [],
		});
	});

	it('should return success for address with eligible multisig address claim, and signed signatures', async () => {
		getLeafMapStub.returns(null);
		const lskAddress = randomLskAddress();
		const leaf = buildMockLeaf({
			numberOfSignatures: 2,
			mandatoryKeys: [randomHash()],
			optionalKeys: [randomHash(), randomHash()],
			proof: [utils.getRandomBytes(32).toString('hex')],
		});
		const signaturesFromDB = [
			buildMockSignature({
				signer: lskAddress,
			}),
		];
		getMultisigMapStub.returns([leaf]);
		signatureFindAllStub.returns(signaturesFromDB);

		const result = await check({ lskAddress });
		expect(result).to.deep.equal({
			account: null,
			multisigAccounts: [
				{
					...leaf,
					ready: false,
				},
			],
			signatures: signaturesFromDB,
		});
	});
});
