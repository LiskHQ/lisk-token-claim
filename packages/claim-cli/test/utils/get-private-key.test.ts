import * as sinon from 'sinon';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as crypto from '@liskhq/lisk-cryptography';
import { HDNodeWallet, Wallet } from 'ethers';

import * as getPrompts from '../../src/utils/get-prompts';

import {
	getETHWalletFromMnemonic,
	getETHWalletKeyFromString,
	getLSKPrivateKeyFromMnemonic,
	getLSKPrivateKeyFromString,
} from '../../src/utils';

describe('getPrivateKey', () => {
	const { expect } = chai;
	chai.use(chaiAsPromised);

	let inputStub: sinon.SinonStub;
	let passwordStub: sinon.SinonStub;
	let printStub: sinon.SinonStub;

	// Invalid
	const badMnemonic = new Array(12).fill('test').join(' ');
	const correctMnemonic = 'test test test test test test test test test test test junk';
	const lskPath = "m/44'/134'/0'";
	const ethPath = "m/44'/60'/0'/0/0";

	beforeEach(() => {
		inputStub = sinon.stub(getPrompts, 'getInput');
		passwordStub = sinon.stub(getPrompts, 'getPassword');
		printStub = sinon.stub(console, 'log');
	});

	afterEach(() => {
		inputStub.restore();
		passwordStub.restore();
		printStub.restore();
	});

	describe('getLSKPrivateKeyFromMnemonic', () => {
		it('should throw when mnemonic is not valid', async () => {
			inputStub.onCall(0).resolves(badMnemonic);

			await expect(getLSKPrivateKeyFromMnemonic()).to.eventually.be.rejectedWith(
				'Invalid Mnemonic, please check again.',
			);
		});

		it('should get valid private key from mnemonic and path', async () => {
			passwordStub.onCall(0).resolves(correctMnemonic);
			inputStub.onCall(0).resolves(lskPath);

			const privateKey = await getLSKPrivateKeyFromMnemonic();
			expect(privateKey).to.be.deep.eq(
				await crypto.ed.getPrivateKeyFromPhraseAndPath(correctMnemonic, lskPath),
			);
		});
	});

	describe('getLSKPrivateKeyFromString', () => {
		const privateKey = crypto.utils.getRandomBytes(32);
		const publicKey = crypto.ed.getPublicKeyFromPrivateKey(privateKey);

		it('should throw when private key has invalid format', async () => {
			passwordStub.onCall(0).resolves(privateKey.toString('hex') + 'f');

			await expect(getLSKPrivateKeyFromString()).to.eventually.be.rejectedWith(
				'Invalid Private Key, please check again. Private Key should be 64 or 128 characters long.',
			);
		});

		it('should get valid 64-character-long private key with 0x prefix', async () => {
			passwordStub.onCall(0).resolves('0x' + privateKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});

		it('should get valid 128-character-long private key with 0x prefix', async () => {
			passwordStub
				.onCall(0)
				.resolves('0x' + privateKey.toString('hex') + publicKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});

		it('should get valid 64-character-long private key without 0x', async () => {
			passwordStub.onCall(0).resolves(privateKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});

		it('should get valid 128-character-long private key without 0x', async () => {
			passwordStub.onCall(0).resolves(privateKey.toString('hex') + publicKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});
	});

	describe('getETHWalletFromMnemonic', () => {
		it('should throw when mnemonic is not valid', async () => {
			passwordStub.onCall(0).resolves(badMnemonic);

			await expect(getETHWalletFromMnemonic()).to.eventually.be.rejectedWith(
				'Invalid Mnemonic, please check again.',
			);
		});

		it('should get valid private key from mnemonic, passphrase and path', async () => {
			const passphrase = 'foobar';

			passwordStub.onCall(0).resolves(correctMnemonic);
			passwordStub.onCall(1).resolves(passphrase);
			inputStub.onCall(0).resolves(ethPath);

			const wallet = await getETHWalletFromMnemonic();

			// Verifiable at https://iancoleman.io/bip39
			expect(wallet).to.be.deep.eq(HDNodeWallet.fromPhrase(correctMnemonic, passphrase, ethPath));
		});
	});

	describe('getETHWalletKeyFromString', () => {
		const validPrivateKeyString = new Array(64).fill('e').join('');

		it('should throw when private key has invalid format', async () => {
			passwordStub.onCall(0).resolves(validPrivateKeyString + 'f');

			await expect(getETHWalletKeyFromString()).to.eventually.be.rejectedWith(
				'Invalid Private Key, please check again. Private Key should be 64-character long.',
			);
		});

		it('should get valid private key with 0x prefix', async () => {
			passwordStub.onCall(0).resolves('0x' + validPrivateKeyString);

			const wallet = await getETHWalletKeyFromString();
			expect(wallet).to.be.deep.eq(new Wallet(validPrivateKeyString));
		});

		it('should get valid private key without 0x', async () => {
			passwordStub.onCall(0).resolves(validPrivateKeyString);

			const wallet = await getETHWalletKeyFromString();
			expect(wallet).to.be.deep.eq(new Wallet(validPrivateKeyString));
		});
	});
});
