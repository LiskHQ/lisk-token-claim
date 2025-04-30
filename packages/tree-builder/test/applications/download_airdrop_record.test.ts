import { expect } from 'chai';
import { consolidateRecords } from '../../src/applications/generate-hodlerdrop-redistribution-merkle-tree/download_airdrop_record';

describe('downloadAirdropRecord', () => {
	describe('consolidateRecords', () => {
		it('should group the value of claimedAmount for the same user', () => {
			const subgraphResponse = [
				{
					ID: '1',
					lskAddress: '0x123',
					recipient: '0xabc',
					amount: '10000',
				},
				{
					ID: '2',
					lskAddress: '0x456',
					recipient: '0xabc',
					amount: '20000',
				},
				{
					ID: '3',
					lskAddress: '0x789',
					recipient: '0xdef',
					amount: '30000',
				},
			];

			const result = consolidateRecords(subgraphResponse);

			// https://www.wolframalpha.com/input?i=%2810000+*+10+**+18%29+*+%281234567+*+10+**+18%29+%2F+%283000000+*+10+**+18+-+1234567+*+10+**+18%29
			expect(result).to.deep.eq([
				{
					address: '0xabc',
					claimedAmountWei: BigInt(30000).toString(),
				},
				{
					address: '0xdef',
					claimedAmountWei: BigInt(30000).toString(),
				},
			]);
		});
	});
});
