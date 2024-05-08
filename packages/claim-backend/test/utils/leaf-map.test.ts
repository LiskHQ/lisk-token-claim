import { expect } from 'chai';
import * as sinon from 'sinon';
import { address } from '@liskhq/lisk-cryptography';
import { getLeafMap, getMultisigMap, loadMerkleTree } from '../../src/utils/leaf-map';
import { buildMockLeaf, randomHash, randomPublicKeyBuffer } from '../utils';
import { append0x } from '../../src/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

describe('leafMap', () => {
	describe('loadMerkleTree', () => {
		before(() => {
			process.env.MERKLE_TREE_PATH = '';
		});

		beforeEach(() => {
			sinon.stub(fs.promises, 'readFile');
		});

		afterEach(() => {
			sinon.restore();
		});

		it('should throw error when MERKLE_TREE_PATH is not set', async () => {
			try {
				await loadMerkleTree();
			} catch (err) {
				expect(err instanceof Error && err.message).contain(
					'MERKLE_TREE_PATH is invalid or does not exist',
				);
			}
		});

		it('should throw error when MERKLE_TREE_PATH is not an existing file', async () => {
			process.env.MERKLE_TREE_PATH = 'path/to/merkle-tree.json';
			fs.promises.readFile.throws('Not Exist');
			try {
				await loadMerkleTree();
			} catch (err) {
				expect(err instanceof Error && err.message).contain(
					`${process.env.MERKLE_TREE_PATH} does not exist or is not a proper JSON`,
				);
			}
		});

		it('should load JSON from MERKLE_TREE_PATH', async () => {
			const publicKey = randomPublicKeyBuffer();
			const lskAddress = address.getLisk32AddressFromPublicKey(publicKey);

			const accountLeaf = buildMockLeaf({
				lskAddress,
				address: append0x(address.getAddressFromPublicKey(publicKey)),
			});
			const multisigLeaves = [
				buildMockLeaf({
					numberOfSignatures: 2,
					mandatoryKeys: [append0x(publicKey), randomHash()],
				}),
				buildMockLeaf({
					numberOfSignatures: 2,
					mandatoryKeys: [append0x(publicKey), randomHash()],
				}),
			];
			const merkleTree = {
				merkleRoot: randomHash(),
				leaves: [accountLeaf, ...multisigLeaves],
			};

			process.env.MERKLE_TREE_PATH = 'path/to/merkle-tree.json';
			fs.promises.readFile.returns(JSON.stringify(merkleTree));

			await loadMerkleTree();
			expect(getLeafMap(lskAddress)).to.deep.equal(accountLeaf);
			expect(getMultisigMap(lskAddress)).to.deep.equal(multisigLeaves);
		});
	});
});
