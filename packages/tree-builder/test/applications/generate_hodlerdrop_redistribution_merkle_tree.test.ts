import { expect } from 'chai';
import { keccak256 } from 'ethers';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { defaultAbiCoder } from '@ethersproject/abi';
import {
	applyClaimMultiplier,
	createPayload,
	buildHodlerdropRedistributionTree,
} from '../../src/applications/generate-hodlerdrop-redistribution-merkle-tree/build_hodlerdrop_redistribution_tree';
import { AirdropClaimedAccount, HodlerdropAccount } from '../../src/interface';
import { HODLERDROP_REDISTRIBUTION_LEAF_ENCODING } from '../../src/constants';

const ETHER_TO_WEI = BigInt(10 ** 18);
const etherToWei = (ether: string | number): bigint => BigInt(ether) * ETHER_TO_WEI;

describe('generateHodlerdropRedistributionMerkleTree', () => {
	describe('applyClaimMultiplier', () => {
		it('should calculate the claim multiplier, and rounded down correctly', () => {
			const userAmount = etherToWei(10000);
			const airdropAmount = etherToWei(3000000);
			const unclaimedAmount = etherToWei(1234567);

			const result = applyClaimMultiplier(userAmount, airdropAmount, unclaimedAmount);

			// https://www.wolframalpha.com/input?i=%2810000+*+10+**+18%29+*+%281234567+*+10+**+18%29+%2F+%283000000+*+10+**+18+-+1234567+*+10+**+18%29
			expect(result).to.eq(BigInt('6992998318259599769574'));
		});
	});

	describe('createPayload', () => {
		it('should create payload correctly', () => {
			const account = {
				address: '0xfoobar',
				claimedAmountWei: etherToWei(10000).toString(),
				claimableAmountWei: '6992998318259599769574',
			};

			const result = createPayload(account);

			expect(result).to.deep.eq([account.address, account.claimableAmountWei]);
		});
	});

	describe('buildHodlerdropRedistributionTree', () => {
		const accounts: AirdropClaimedAccount[] = [
			{
				address: '0x0000000000000000000000000000000000000001',
				claimedAmountWei: etherToWei(1000).toString(),
			},
			{
				address: '0x0000000000000000000000000000000000000002',
				claimedAmountWei: etherToWei(2000).toString(),
			},
			{
				address: '0x0000000000000000000000000000000000000003',
				claimedAmountWei: etherToWei(5000).toString(),
			},
		];

		const airdropAmount = etherToWei(10000);
		const unclaimedAmount =
			airdropAmount -
			accounts.reduce((acc, account) => acc + BigInt(account.claimedAmountWei), BigInt(0));

		const appliedMultiplierAccounts: HodlerdropAccount[] = accounts.map(account => ({
			...account,
			claimableAmountWei: applyClaimMultiplier(
				BigInt(account.claimedAmountWei),
				airdropAmount,
				unclaimedAmount,
			).toString(),
		}));

		it('should reject unsorted array of accounts', () => {
			// Swap the second and last elements
			const unsortedAccounts = [accounts[0], accounts[2], accounts[1]];
			expect(() =>
				buildHodlerdropRedistributionTree(unsortedAccounts, airdropAmount, unclaimedAmount),
			).to.throw('Addresses not sorted! Please sort your addresses before continue');
		});

		it('should return valid tree with proof', () => {
			const merkleTree = buildHodlerdropRedistributionTree(
				accounts,
				airdropAmount,
				unclaimedAmount,
			);
			for (const [i, leaf] of merkleTree.leaves.entries()) {
				const encodedMessage = defaultAbiCoder.encode(
					HODLERDROP_REDISTRIBUTION_LEAF_ENCODING,
					createPayload(appliedMultiplierAccounts[i]),
				);

				// Verify Leaf is in correct order
				expect(leaf.address).to.equal(accounts[i].address);

				// Verify Encoding
				expect(leaf.hash).equal(keccak256(keccak256(encodedMessage)));

				// Verify Proof exists in MerkleTree
				expect(merkleTree.tree.getProof(createPayload(appliedMultiplierAccounts[i]))).deep.equal(
					leaf.proof,
				);

				// Verify Proof is valid with respect to MerkleRoot
				expect(
					StandardMerkleTree.verify(
						merkleTree.tree.root,
						HODLERDROP_REDISTRIBUTION_LEAF_ENCODING,
						createPayload(appliedMultiplierAccounts[i]),
						leaf.proof,
					),
				).deep.equal(true);
			}
		});

		it('should generate identical tree comparing with calling OZ library directly', () => {
			const merkleTreeFromBuildTree = buildHodlerdropRedistributionTree(
				accounts,
				airdropAmount,
				unclaimedAmount,
			);
			const merkleTreeFromOz = StandardMerkleTree.of(
				appliedMultiplierAccounts.map(account => [account.address, account.claimableAmountWei]),
				HODLERDROP_REDISTRIBUTION_LEAF_ENCODING,
			);
			expect(merkleTreeFromBuildTree.tree.root).to.be.equal(merkleTreeFromOz.root);

			const merkleTreeFromOzDump = merkleTreeFromOz.dump();
			const ozLeaf = merkleTreeFromOzDump.values[0].value;
			expect(merkleTreeFromBuildTree.leaves[0].address).to.be.equal(ozLeaf[0]);
			expect(merkleTreeFromBuildTree.leaves[0].claimableAmountWei).to.be.equal(ozLeaf[1]);
		});
	});
});
