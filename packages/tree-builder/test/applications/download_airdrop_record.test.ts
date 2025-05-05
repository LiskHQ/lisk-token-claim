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
