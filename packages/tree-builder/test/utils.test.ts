import { expect } from 'chai';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { readExcludedAddresses } from '../src/utils';
import { address, utils } from '@liskhq/lisk-cryptography';

describe('utils', () => {
	describe('readExcludedAddresses', () => {
		const excludedAddresses = [
			address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32)),
			address.getLisk32AddressFromPublicKey(utils.getRandomBytes(32)),
		];
		const excludedAddressPath = path.join(os.tmpdir(), 'excludedAddress');
		beforeEach(() => {
			fs.writeFileSync(excludedAddressPath, excludedAddresses.join('\n'), 'utf-8');
		});

		afterEach(() => {
			fs.unlinkSync(excludedAddressPath);
		});

		it('should return empty array when excludedAddressesPath is undefined', () => {
			expect(readExcludedAddresses(undefined)).to.deep.eq([]);
		});

		it('should throw excludedAddressesPath does not exist', () => {
			const resolvedPath = path.resolve('foobar');
			expect(() => readExcludedAddresses('foobar')).to.throw(`${resolvedPath} does not exist`);
		});

		it('should throw when one of the address is not a valid Lisk32 address', () => {
			fs.writeFileSync(excludedAddressPath, ['foobar'].join('\n'), 'utf-8');
			expect(() => readExcludedAddresses(excludedAddressPath)).to.throw(
				`Address length does not match requirements. Expected 41 characters.`,
			);
		});

		it('should read file path and return excluded addresses correctly', () => {
			expect(readExcludedAddresses(excludedAddressPath)).to.deep.eq(excludedAddresses);
		});
	});
});
