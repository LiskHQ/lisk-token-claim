import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { address, utils } from '@liskhq/lisk-cryptography';
import * as LeafMap from '../../src/utils/leaf-map';
import { submitMultisig } from '../../src/controllers/submit-multisig';
import { ErrorCode } from '../../src/utils/error';
import Signature from '../../src/models/signature.model';
import * as verifySignature from '../../src/utils/verify-signature';
import { buildMockLeaf, randomEthAddress, randomHash, randomLskAddress } from '../utils';

interface SubmitMultisigBody {
	lskAddress: string;
	destination: string;
	publicKey: string;
	r: string;
	s: string;
}

describe('submitMultisig', () => {
	const { expect } = chai;
	chai.use(chaiAsPromised);

	const createMultisigBody = (body: Partial<SubmitMultisigBody>): SubmitMultisigBody => {
		const publicKey = utils.getRandomBytes(32);
		return {
			lskAddress: body.lskAddress ?? address.getLisk32AddressFromPublicKey(publicKey),
			destination: body.destination ?? randomEthAddress(),
			publicKey: body.publicKey ?? publicKey.toString('hex'),
			r: body.r ?? utils.getRandomBytes(32).toString('hex'),
			s: body.s ?? utils.getRandomBytes(32).toString('hex'),
		};
	};

	let getLeafMapStub: sinon.SinonStub;
	let verifySignatureStub: sinon.SinonStub;
	let signatureCountStub: sinon.SinonStub;
	let signatureCreateStub: sinon.SinonStub;
	let signatureFindOneStub: sinon.SinonStub;
	let signatureUpdateStub: sinon.SinonStub;

	beforeEach(() => {
		getLeafMapStub = sinon.stub(LeafMap, 'getLeafMap');
		verifySignatureStub = sinon.stub(verifySignature, 'verifySignature');
		signatureCountStub = sinon.stub(Signature, 'count');
		signatureCreateStub = sinon.stub(Signature, 'create');
		signatureFindOneStub = sinon.stub(Signature, 'findOne');
		signatureUpdateStub = sinon.stub(Signature, 'update');
	});

	afterEach(() => {
		getLeafMapStub.restore();
		verifySignatureStub.restore();
		signatureCountStub.restore();
		signatureCreateStub.restore();
		signatureFindOneStub.restore();
		signatureUpdateStub.restore();
	});

	it('should return error when LSK address is not a multisig address', async () => {
		getLeafMapStub.returns(undefined);

		const lskAddress = address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32));

		await expect(
			submitMultisig(
				createMultisigBody({
					lskAddress,
				}),
			),
		).to.eventually.be.rejectedWith(ErrorCode.INVALID_LSK_ADDRESS);
	});

	it('should return error when destination address is not a valid ETH address', async () => {
		const lskAddress = randomLskAddress();
		getLeafMapStub.returns(
			buildMockLeaf({
				lskAddress,
				numberOfSignatures: 2,
				mandatoryKeys: [randomHash(), randomHash()],
			}),
		);

		const ethAddress = 'foobar';
		await expect(
			submitMultisig(
				createMultisigBody({
					lskAddress,
					destination: ethAddress,
				}),
			),
		).to.eventually.be.rejectedWith(ErrorCode.INVALID_DESTINATION_ADDRESS);
	});

	it('should return error when public key is not part of that multisig address', async () => {
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

		await expect(submitMultisig(createMultisigBody({}))).to.eventually.be.rejectedWith(
			ErrorCode.PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS,
		);
	});

	it('should return error when too many optional keys supplied', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
			}),
		);
		signatureCountStub.resolves(1);

		await expect(submitMultisig(createMultisigBody({ publicKey }))).to.eventually.be.rejectedWith(
			ErrorCode.NUMBER_OF_SIGNATURES_REACHED,
		);
	});

	it('should return error when signature is invalid', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [],
			}),
		);
		verifySignatureStub.returns(false);

		await expect(submitMultisig(createMultisigBody({ publicKey }))).to.eventually.be.rejectedWith(
			ErrorCode.INVALID_SIGNATURE,
		);
	});

	it('should return error when lskAddress-destination-publicKey has been signed before', async () => {
		const publicKey = utils.getRandomBytes(32).toString('hex');
		const destination = randomEthAddress();
		const multisigRequest = createMultisigBody({ publicKey, destination });
		getLeafMapStub.returns(
			buildMockLeaf({
				numberOfSignatures: 2,
				mandatoryKeys: [publicKey, utils.getRandomBytes(32).toString('hex')],
				optionalKeys: [],
			}),
		);
		verifySignatureStub.returns(true);
		signatureFindOneStub.resolves(multisigRequest);

		await expect(
			submitMultisig(
				createMultisigBody({
					destination,
					publicKey,
				}),
			),
		).to.eventually.be.rejectedWith(ErrorCode.ALREADY_SIGNED);
	});

	it('should return success and store to db, and ready = false when number of signatures not reached', async () => {
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
		signatureCountStub.resolves(1);
		signatureFindOneStub.resolves(null);

		const result = await submitMultisig(createMultisigBody({ publicKey }));

		expect(result).to.deep.equal({
			ready: false,
			success: true,
		});
	});

	it('should return success and update the db when lskAddress-publicKey with another destination is already in db, and ready = false when number of signatures not reached', async () => {
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
		signatureCountStub.resolves(1);
		signatureFindOneStub.resolves(
			createMultisigBody({
				destination: randomEthAddress(),
				publicKey,
			}),
		);

		const result = await submitMultisig(
			createMultisigBody({
				publicKey,
			}),
		);

		expect(result).to.deep.equal({
			ready: false,
			success: true,
		});
	});

	it('should return success and store to db, and ready = true when number of signatures has reached', async () => {
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
		signatureCountStub.resolves(2);
		signatureFindOneStub.resolves(null);

		const result = await submitMultisig(createMultisigBody({ publicKey }));

		expect(result).to.deep.equal({
			ready: true,
			success: true,
		});
	});
});
