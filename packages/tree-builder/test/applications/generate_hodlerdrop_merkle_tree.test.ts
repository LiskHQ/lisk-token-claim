import { expect } from 'chai';
import {
	applyClaimMultiplier,
	createPayload,
} from '../../src/applications/generate-hodlerdrop-merkle-tree/build_hodlerdrop_tree';

const ETHER_TO_WEI = BigInt(10 ** 18);

describe('generateHodlerdropMerkleTree', () => {
	describe('applyClaimMultiplier', () => {
		it('should calculate the claim multiplier, and rounded down correctly', () => {
			const userAmount = BigInt(10000) * ETHER_TO_WEI;
			const airdropAmount = BigInt(3000000) * ETHER_TO_WEI;
			const unclaimedAmount = BigInt(1234567) * ETHER_TO_WEI;

			const result = applyClaimMultiplier(userAmount, airdropAmount, unclaimedAmount);

			// https://www.wolframalpha.com/input?i=%2810000+*+10+**+18%29+*+%281234567+*+10+**+18%29+%2F+%283000000+*+10+**+18+-+1234567+*+10+**+18%29
			expect(result).to.eq(BigInt('6992998318259599769574'));
		});
	});

	describe('createPayload', () => {
		it('should create payload correctly', () => {
			const account = {
				address: '0xfoobar',
				claimedAmountWei: (BigInt(10000) * ETHER_TO_WEI).toString(),
				balanceWei: '6992998318259599769574',
			};

			const result = createPayload(account);

			expect(result).to.deep.eq([account.address, account.balanceWei]);
		});
	});
});
