import { expect } from 'chai';
import * as sinon from 'sinon';
import { checkAirdropEligibility } from '../../src/controllers/check-airdrop-eligibility';
import * as LeafMap from '../../src/utils/leaf-map';
import { ErrorCode } from '../../src/utils/error';
import { buildMockAirdropLeaf, randomLskAddress } from '../utils';

describe('checkAirdropEligibility', () => {
	let getLeafMapStub: sinon.SinonStub;

	beforeEach(() => {
		getLeafMapStub = sinon.stub(LeafMap, 'getAirdropLeafMap').returns(null);
	});

	afterEach(() => {
		getLeafMapStub.restore();
	});

	it('should return error when address is not valid', () => {
		const lskAddress = 'foobar';
		expect(() => checkAirdropEligibility({ lskAddress })).to.throw(ErrorCode.INVALID_LSK_ADDRESS);
	});

	it('should return success with null when address is not eligible for airdrop', () => {
		const lskAddress = randomLskAddress();
		const result = checkAirdropEligibility({ lskAddress });
		expect(result).to.deep.equal({
			account: null,
		});
	});

	it('should return success and leaf details for eligible address', () => {
		const leaf = buildMockAirdropLeaf({});
		getLeafMapStub.returns(leaf);

		const result = checkAirdropEligibility({ lskAddress: leaf.lskAddress });
		expect(result).to.deep.equal({
			account: leaf,
		});
	});
});
