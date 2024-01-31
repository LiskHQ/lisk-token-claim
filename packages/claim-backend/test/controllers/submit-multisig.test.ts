import sinon from 'sinon';
import * as LeafMap from '../../src/utils/leaf-map';
import { submitMultisig } from '../../src/controllers/submit-multisig';
import { expect } from 'chai';
import { ErrorCode } from '../../src/utils/error';
import { address, utils } from '@liskhq/lisk-cryptography';
import Signature from '../../src/models/Signature.model';
import * as verifySignature from '../../src/utils/verify-signature';
import { UniqueConstraintError } from 'sequelize';
import { buildMockLeaf, randomEthAddress, randomHash, randomLskAddress } from '../utils';

interface SubmitMultisigBody {
	lskAddress: string;
	destination: string;
	publicKey: string;
	r: string;
	s: string;
}

describe('submitMultisig', () => {
	const createRequest = (body: Partial<SubmitMultisigBody>): SubmitMultisigBody => {
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

	it('should return error when LSK address is not a multisig address', async () => {
		getLeafMapStub.returns(undefined);

		const lskAddress = address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32));

		try {
			await submitMultisig(
				createRequest({
					lskAddress,
				}),
			);
		} catch (err) {
			expect(err instanceof Error && err.message).to.equal(ErrorCode.INVALID_LSK_ADDRESS);
		}
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
		try {
			await submitMultisig(
				createRequest({
					lskAddress,
					destination: ethAddress,
				}),
			);
		} catch (err) {
			expect(err instanceof Error && err.message).to.equal(ErrorCode.INVALID_DESTINATION_ADDRESS);
		}
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

		try {
			await submitMultisig(createRequest({}));
		} catch (err) {
			expect(err instanceof Error && err.message).to.equal(
				ErrorCode.PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS,
			);
		}
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
		signatureCountStub.returns(Promise.resolve(1));

		try {
			await submitMultisig(createRequest({ publicKey }));
		} catch (err) {
			expect(err instanceof Error && err.message).to.equal(ErrorCode.NUMBER_OF_SIGNATURES_REACHED);
		}
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

		try {
			await submitMultisig(createRequest({ publicKey }));
		} catch (err) {
			expect(err instanceof Error && err.message).to.equal(ErrorCode.INVALID_SIGNATURE);
		}
	});

	it('should return error when lskAddress-destination-publicKey has been signed before', async () => {
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

		try {
			await submitMultisig(createRequest({ publicKey }));
		} catch (err) {
			expect(err instanceof Error && err.message).to.equal(ErrorCode.ALREADY_SIGNED);
		}
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
		signatureCountStub.returns(Promise.resolve(1));

		const result = await submitMultisig(createRequest({ publicKey }));

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
		signatureCountStub.returns(Promise.resolve(2));

		const result = await submitMultisig(createRequest({ publicKey }));

		expect(result).to.deep.equal({
			ready: true,
			success: true,
		});
	});
});
