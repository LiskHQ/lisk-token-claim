import sinon from 'sinon';
import * as LeafMap from '../../src/utils/leaf-map';
import httpMocks from 'node-mocks-http';
import { submitMultisig } from '../../src/controllers/submit-multisig';
import { expect } from 'chai';
import { ErrorCode } from '../../src/utils/error';
import { address, utils } from '@liskhq/lisk-cryptography';
import Signature from '../../src/models/Signature.model';
import * as verifySignature from '../../src/utils/verify-signature';
import { UniqueConstraintError } from 'sequelize';
import { buildMockLeaf, randomHash, randomLskAddress } from '../utils';

interface SubmitMultisigBody {
	lskAddress: string;
	destination: string;
	publicKey: string;
	r: string;
	s: string;
}

describe('submitMultisig', () => {
	const createReqRes = (body: Partial<SubmitMultisigBody>) => {
		const publicKey = utils.getRandomBytes(32);
		return {
			request: httpMocks.createRequest({
				method: 'POST',
				url: '/submitMultisig',
				body: {
					lskAddress: body.lskAddress ?? address.getLisk32AddressFromPublicKey(publicKey),
					destination: body.destination ?? '0x34A1D3fff3958843C43aD80F30b94c510645C316',
					publicKey: body.publicKey ?? publicKey.toString('hex'),
					r: body.r ?? utils.getRandomBytes(32).toString('hex'),
					s: body.s ?? utils.getRandomBytes(32).toString('hex'),
				},
			}),
			response: httpMocks.createResponse(),
		};
	};

	let getLeafMapStub: sinon.SinonStub;
	let verifySignatureStub: sinon.SinonStub;
	let signatureCountStub: sinon.SinonStub;
	let signatureCreateStub: sinon.SinonStub;

	beforeEach(() => {
		getLeafMapStub = sinon.stub(LeafMap, 'getLeafMap');
		verifySignatureStub = sinon.stub(verifySignature, 'verifySignature');
		signatureCountStub = sinon.stub(Signature, 'count');
		signatureCreateStub = sinon.stub(Signature, 'create');
	});

	afterEach(() => {
		getLeafMapStub.restore();
		verifySignatureStub.restore();
		signatureCountStub.restore();
		signatureCreateStub.restore();
	});

	it('should return 400 when LSK address is not a multisig address', async () => {
		getLeafMapStub.returns(undefined);

		const lskAddress = address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32));

		const { request, response } = createReqRes({
			lskAddress,
		});
		await submitMultisig(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.INVALID_LSK_ADDRESS);
		expect(data.message).to.equal(`'${lskAddress}' is not a valid Multisig address`);
	});

	it('should return 400 when destination address is not a valid ETH address', async () => {
		const lskAddress = randomLskAddress();
		getLeafMapStub.returns(
			buildMockLeaf({
				lskAddress,
				numberOfSignatures: 2,
				mandatoryKeys: [randomHash(), randomHash()],
			}),
		);

		const ethAddress = 'foobar';
		const { request, response } = createReqRes({
			lskAddress,
			destination: ethAddress,
		});
		await submitMultisig(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.INVALID_DESTINATION_ADDRESS);
		expect(data.message).to.equal(`'${ethAddress}' is not a valid ETH address`);
	});

	it('should return 400 when public key is not part of that multisig address', async () => {
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [
					utils.getRandomBytes(32).toString('hex'),
					utils.getRandomBytes(32).toString('hex'),
				],
			}),
		);

		const { request, response } = createReqRes({});
		await submitMultisig(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS);
		expect(data.message).to.equal(
			`'${request.body.publicKey}' does not own '${request.body.lskAddress}'`,
		);
	});

	it('should return 400 when too many optional keys supplied', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
			}),
		);
		signatureCountStub.returns(Promise.resolve(1));
		const { request, response } = createReqRes({
			publicKey,
		});
		await submitMultisig(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.NUMBER_OF_SIGNATURES_REACHED);
		expect(data.message).to.equal(`Number of Signatures has reached`);
	});

	it('should return 400 when signature is invalid', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [],
			}),
		);
		const { request, response } = createReqRes({
			publicKey,
		});
		verifySignatureStub.returns(false);

		await submitMultisig(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.INVALID_SIGNATURE);
		expect(data.message).to.equal(`Invalid Signature`);
	});

	it('should return 400 when lskAddress-destination-publicKey has been signed before', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [],
			}),
		);
		verifySignatureStub.returns(true);
		signatureCreateStub.rejects(new UniqueConstraintError({}));

		const { request, response } = createReqRes({
			publicKey,
		});
		await submitMultisig(request, response);
		const data = response._getJSONData();

		expect(response.statusCode).to.equal(400);
		expect(data.error).to.equal(true);
		expect(data.code).to.equal(ErrorCode.ALREADY_SIGNED);
		expect(data.message).to.equal(
			`'${request.body.lskAddress}-${request.body.destination}-${publicKey}' has been signed`,
		);
	});

	it('should return 200 and store to db', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [],
			}),
		);
		verifySignatureStub.returns(true);
		signatureCreateStub.resolves();

		const { request, response } = createReqRes({
			publicKey,
		});
		await submitMultisig(request, response);

		expect(response.statusCode).to.equal(200);
	});
});
