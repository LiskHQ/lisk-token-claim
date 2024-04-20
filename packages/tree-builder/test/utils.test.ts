import { expect } from 'chai';
import * as sinon from 'sinon';
import { readExcludedAddresses } from '../src/utils';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

describe('utils', () => {
	describe('#readExcludedAddresses', () => {
		const addresses = [
			'lskbqdbu354hz87mnc7pddk8ywef33jnuqc5odhbp',
			'lskmpb6xzeux5tk65qm7ffs5qdtm7cu5b2rmog6tr',
			'lskqbhxe6h7ymjkg6h4dq6s88ptm4qh3jke7g4nva',
			'lskhysxtgcjjen7tsn8su64y3fs85knymvugw3wyt',
		];

		beforeEach(() => {
			sinon.stub(fs, 'existsSync').returns(true);
			sinon.stub(fs, 'readFileSync').returns(addresses.join('\n'));
		});

		afterEach(() => {
			sinon.restore();
		});

		it('should return empty array when input is undefined', () => {
			const result = readExcludedAddresses(undefined);
			expect(result).to.deep.equal([]);
		});

		it('should resolve the relative path with ~', () => {
			readExcludedAddresses('~/home');

			const resolvedPath = fs.existsSync.getCall(0).args[0];
			expect(path.isAbsolute(resolvedPath)).to.be.true;
		});

		it('should resolve the relative path without ~', () => {
			readExcludedAddresses('./home');

			const resolvedPath = fs.existsSync.getCall(0).args[0];

			expect(path.isAbsolute(resolvedPath)).to.be.true;
		});

		it('should resolve the absolute path', () => {
			const filePath = '/home/lisk/path.json';
			readExcludedAddresses(filePath);

			const resolvedPath = fs.existsSync.getCall(0).args[0];

			expect(resolvedPath).to.equal(filePath);
		});

		it('should throw if the file does not exist', () => {
			const filePath = '/home/lisk/path.json';
			fs.existsSync.returns(false);

			expect(() => readExcludedAddresses(filePath)).to.throw(`${filePath} does not exist`);
		});

		it('should throw if address is invalid', () => {
			fs.readFileSync.returns(`smdbqdbu354hz87mnc7pddk8ywef33jnuqc5odhbp
lskqbhxe6h7ymjkg6h4dq6s88ptm4qh3jke7g
lskhysxtgcjjen7tsn8su64y3fs85knymvugw3wyt`);

			expect(() => readExcludedAddresses('~/home')).to.throw('Invalid address');
		});

		it('should return all the addresses in the list', () => {
			expect(readExcludedAddresses('./home')).to.deep.equal(addresses);
		});
	});
});
