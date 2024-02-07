import { expect } from 'chai';
import * as sinon from 'sinon';
import { address } from '@liskhq/lisk-cryptography';
import * as fsHelper from '../../src/utils/fs-helper';
import { getLeafMap, getMultisigMap, loadMerkleTree } from '../../src/utils/leaf-map';
import { buildMockLeaf, randomHash, randomPublicKeyBuffer } from '../utils';
import { append0x } from '../../src/utils';

describe('leafMap', () => {
	describe('loadMerkleTree', () => {
		before(() => {
			process.env.MERKLE_TREE_PATH = '';
		});

		let fileExistsStub: sinon.SinonStub;
		let readJsonStub: sinon.SinonStub;

		beforeEach(() => {
			fileExistsStub = sinon.stub(fsHelper, 'fileExists');
			readJsonStub = sinon.stub(fsHelper, 'readJson');
		});

		afterEach(() => {
			fileExistsStub.restore();
			readJsonStub.restore();
		});

		it('should throw error when MERKLE_TREE_PATH is not set', () => {
			try {
				loadMerkleTree();
			} catch (err) {
				expect(err instanceof Error && err.message).contain(
					'MERKLE_TREE_PATH is invalid or does not exist',
				);
			}
		});

		it('should throw error when MERKLE_TREE_PATH is not an existing file', () => {
			process.env.MERKLE_TREE_PATH = 'path/to/merkle-tree.json';
			fileExistsStub.returns(false);
			try {
				loadMerkleTree();
			} catch (err) {
				expect(err instanceof Error && err.message).contain(
					'MERKLE_TREE_PATH is invalid or does not exist',
				);
			}
		});

		it('should load JSON from MERKLE_TREE_PATH', () => {
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
			fileExistsStub.returns(true);
			readJsonStub.returns(merkleTree);

			loadMerkleTree();
			expect(getLeafMap(lskAddress)).to.deep.equal(accountLeaf);
			expect(getMultisigMap(lskAddress)).to.deep.equal(multisigLeaves);
		});
	});
});
