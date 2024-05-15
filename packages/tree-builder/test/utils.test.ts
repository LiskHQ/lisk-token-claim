import * as chai from 'chai';
import * as sinon from 'sinon';
import * as path from 'path';
import chaiAsPromised from 'chai-as-promised';

import { readExcludedAddresses } from '../src/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

describe('utils', () => {
	const { expect } = chai;
	chai.use(chaiAsPromised);

	describe('#readExcludedAddresses', () => {
		const addresses = [
			'lskbqdbu354hz87mnc7pddk8ywef33jnuqc5odhbp',
			'lskmpb6xzeux5tk65qm7ffs5qdtm7cu5b2rmog6tr',
			'lskqbhxe6h7ymjkg6h4dq6s88ptm4qh3jke7g4nva',
			'lskhysxtgcjjen7tsn8su64y3fs85knymvugw3wyt',
		];

		beforeEach(() => {
			sinon.stub(fs.promises, 'readFile').returns(addresses.join('\n'));
		});

		afterEach(() => {
			sinon.restore();
		});

		it('should return empty array when input is undefined', async () => {
			const result = await readExcludedAddresses(undefined);
			expect(result).to.deep.equal([]);
		});

		it('should resolve the relative path with ~', async () => {
			await readExcludedAddresses('~/home');

			const resolvedPath = fs.promises.readFile.getCall(0).args[0];
			expect(path.isAbsolute(resolvedPath)).to.be.true;
		});

		it('should resolve the relative path without ~', async () => {
			await readExcludedAddresses('./home');

			const resolvedPath = fs.promises.readFile.getCall(0).args[0];

			expect(path.isAbsolute(resolvedPath)).to.be.true;
		});

		it('should resolve the absolute path', async () => {
			const filePath = '/home/lisk/path.json';
			await readExcludedAddresses(filePath);

			const resolvedPath = fs.promises.readFile.getCall(0).args[0];

			expect(resolvedPath).to.equal(filePath);
		});

		it('should throw if the file does not exist', async () => {
			const filePath = '/home/lisk/path.json';
			fs.promises.readFile.throws('Not Exist');

			await expect(readExcludedAddresses(filePath)).to.be.rejectedWith(
				`${filePath} does not exist or is not valid`,
			);
		});

		it('should throw if address is invalid', async () => {
			fs.promises.readFile.returns(`smdbqdbu354hz87mnc7pddk8ywef33jnuqc5odhbp
lskqbhxe6h7ymjkg6h4dq6s88ptm4qh3jke7g
lskhysxtgcjjen7tsn8su64y3fs85knymvugw3wyt`);

			await expect(readExcludedAddresses('~/home')).to.be.rejectedWith('Invalid address');
		});

		it('should return all the addresses in the list', async () => {
			expect(await readExcludedAddresses('./home')).to.deep.equal(addresses);
		});
	});
});
