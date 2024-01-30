import { expect } from 'chai';
import httpMocks from 'node-mocks-http';
import sinon from 'sinon';
import { utils } from '@liskhq/lisk-cryptography';
import { check } from '../../src/controllers/check';
import { ErrorCode } from '../../src/utils/error';
import * as LeafMap from '../../src/utils/leaf-map';
import { buildMockLeaf, buildMockSignature, randomHash, randomLskAddress } from '../utils';
import Signature from '../../src/models/Signature.model';

describe('check', () => {
	const createReqRes = (lskAddress: string) => {
		return {
			request: httpMocks.createRequest({
				method: 'GET',
				url: '/check',
				params: {
					lskAddress,
				},
			}),
			response: httpMocks.createResponse(),
		};
	};

	let getLeafMapStub: sinon.SinonStub;
	let getMultisigMapStub: sinon.SinonStub;
	let signatureFindAllStub: sinon.SinonStub;
	sinon.stub(LeafMap, 'fileExists').returns(true);

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

	it('should return 400 when address is not valid', async () => {
		const lskAddress = 'foobar';
		const { request, response } = createReqRes(lskAddress);
		await check(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.INVALID_LSK_ADDRESS);
		expect(data.message).to.equal(`'${lskAddress}' is not a valid address.`);
	});

	it('should return 200 with empty result when address is not in leafMap or multisigMap, ie. not eligible', async () => {
		const lskAddress = randomLskAddress();
		getLeafMapStub.returns(null);
		getMultisigMapStub.returns([]);
		const { request, response } = createReqRes(lskAddress);

		await check(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(200);
		expect(data.account).to.equal(null);
		expect(data.multisigAccounts).to.deep.equal([]);
		expect(data.signatures).to.deep.equal([]);
	});

	it('should return 200 for address with eligible regular address claim', async () => {
		const lskAddress = randomLskAddress();
		const leaf = buildMockLeaf({});
		getLeafMapStub.returns(leaf);

		const { request, response } = createReqRes(lskAddress);

		await check(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(200);
		expect(data.account).to.deep.equal(leaf);
	});

	it('should return 200 for address with eligible multisig address claim, and signed signatures', async () => {
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

		const { request, response } = createReqRes(lskAddress);

		await check(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(200);
		expect(data.multisigAccounts[0]).to.deep.equal(leaf);
		expect(data.signatures).to.deep.equal(signaturesFromDB);
	});
});
