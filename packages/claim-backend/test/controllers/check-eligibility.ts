import { expect } from 'chai';
import * as sinon from 'sinon';
import { address } from '@liskhq/lisk-cryptography';
import { checkEligibility } from '../../src/controllers/check-eligibility';
import * as LeafMap from '../../src/utils/leaf-map';
import {
	buildMockLeaf,
	buildMockSignature,
	randomEthAddress,
	randomLskAddress,
	randomPublicKeyBuffer,
} from '../utils';
import Signature from '../../src/models/signature.model';
import { ErrorCode } from '../../src/utils/error';
import { append0x } from '../../src/utils';

describe('checkEligibility', () => {
	let getLeafMapStub: sinon.SinonStub;
	let getMultisigMapStub: sinon.SinonStub;
	let signatureFindAllStub: sinon.SinonStub;

	beforeEach(() => {
		getLeafMapStub = sinon.stub(LeafMap, 'getLeafMap').returns(null);
		getMultisigMapStub = sinon.stub(LeafMap, 'getMultisigMap').returns([]);
		signatureFindAllStub = sinon.stub(Signature, 'findAll').resolves([]);
	});

	afterEach(() => {
		getLeafMapStub.restore();
		getMultisigMapStub.restore();
		signatureFindAllStub.restore();
	});

	it('should return error when address is not valid', async () => {
		const lskAddress = 'foobar';
		try {
			await checkEligibility({ lskAddress });
		} catch (err: unknown) {
			expect(err instanceof Error && err.message).to.eq(ErrorCode.INVALID_LSK_ADDRESS);
		}
	});

	it('should return success with empty result when address is not in leafMap or multisigMap, ie. not eligible', async () => {
		const lskAddress = randomLskAddress();

		const result = await checkEligibility({ lskAddress });
		expect(result).to.deep.equal({
			account: null,
			multisigAccounts: [],
			signatures: [],
		});
	});

	it('should return success for eligible regular address claim', async () => {
		const lskAddress = randomLskAddress();
		const leaf = buildMockLeaf({ lskAddress });
		getLeafMapStub.returns(leaf);

		const result = await checkEligibility({ lskAddress });
		expect(result).to.deep.equal({
			account: leaf,
			multisigAccounts: [],
			signatures: [],
		});
	});

	it('should return success for eligible multisig address claim by submitting multisig address directly, and the claim does NOT have enough signatures', async () => {
		const lskAddress = randomLskAddress();
		const publicKey1 = randomPublicKeyBuffer();
		const publicKey2 = randomPublicKeyBuffer();
		const leaf = buildMockLeaf({
			lskAddress,
			numberOfSignatures: 2,
			mandatoryKeys: [append0x(publicKey1), append0x(publicKey2)],
		});
		// 2 Signers to different destinations
		const signaturesFromDB = [
			buildMockSignature({
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey1),
			}),
			buildMockSignature({
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey2),
			}),
		];
		getLeafMapStub.returns(leaf);
		signatureFindAllStub.resolves(signaturesFromDB);

		const result = await checkEligibility({ lskAddress });
		expect(result).to.deep.equal({
			account: {
				...leaf,
				ready: false,
			},
			multisigAccounts: [],
			signatures: signaturesFromDB,
		});
	});

	it('should return success for eligible multisig address claim by submitting multisig address directly, and the claim HAVE enough signatures', async () => {
		const lskAddress = randomLskAddress();
		const publicKey1 = randomPublicKeyBuffer();
		const publicKey2 = randomPublicKeyBuffer();
		const destination = randomEthAddress();
		const leaf = buildMockLeaf({
			lskAddress,
			numberOfSignatures: 2,
			mandatoryKeys: [append0x(publicKey1), append0x(publicKey2)],
		});
		const signaturesFromDB = [
			buildMockSignature({
				destination,
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey1),
			}),
			buildMockSignature({
				destination,
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey2),
			}),
		];
		getLeafMapStub.returns(leaf);
		signatureFindAllStub.resolves(signaturesFromDB);

		const result = await checkEligibility({ lskAddress });
		expect(result).to.deep.equal({
			account: {
				...leaf,
				ready: true,
			},
			multisigAccounts: [],
			signatures: signaturesFromDB,
		});
	});

	it('should return success for eligible multisig address claim by submitting address who can sign the multisig address, and the claim does NOT have enough signatures', async () => {
		const lskAddress = randomLskAddress();
		const publicKey1 = randomPublicKeyBuffer();
		const publicKey2 = randomPublicKeyBuffer();
		const leaf = buildMockLeaf({
			lskAddress,
			numberOfSignatures: 2,
			mandatoryKeys: [append0x(publicKey1), append0x(publicKey2)],
		});
		const signaturesFromDB = [
			buildMockSignature({
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey1),
			}),
			buildMockSignature({
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey2),
			}),
		];
		getMultisigMapStub.returns([leaf]);
		signatureFindAllStub.resolves(signaturesFromDB);

		const result = await checkEligibility({
			lskAddress: address.getLisk32AddressFromPublicKey(publicKey1),
		});
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

	it('should return success for eligible multisig address claim by submitting address who can sign the multisig address, and the claim HAVE enough signatures', async () => {
		const lskAddress = randomLskAddress();
		const publicKey1 = randomPublicKeyBuffer();
		const publicKey2 = randomPublicKeyBuffer();
		const destination = randomEthAddress();
		const leaf = buildMockLeaf({
			lskAddress,
			numberOfSignatures: 2,
			mandatoryKeys: [append0x(publicKey1), append0x(publicKey2)],
		});
		const signaturesFromDB = [
			buildMockSignature({
				destination,
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey1),
			}),
			buildMockSignature({
				destination,
				lskAddress,
				signer: address.getLisk32AddressFromPublicKey(publicKey2),
			}),
		];
		getMultisigMapStub.returns([leaf]);
		signatureFindAllStub.resolves(signaturesFromDB);

		const result = await checkEligibility({
			lskAddress: address.getLisk32AddressFromPublicKey(publicKey1),
		});
		expect(result).to.deep.equal({
			account: null,
			multisigAccounts: [
				{
					...leaf,
					ready: true,
				},
			],
			signatures: signaturesFromDB,
		});
	});
});
