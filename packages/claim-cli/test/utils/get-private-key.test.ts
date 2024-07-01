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
	let processExitStub: sinon.SinonStub;

	// Invalid
	const badMnemonic = new Array(12).fill('test').join(' ');
	const correctMnemonic = 'test test test test test test test test test test test junk';
	const lskPath = "m/44'/134'/0'";
	const ethPath = "m/44'/60'/0'/0/0";

	beforeEach(() => {
		inputStub = sinon.stub(getPrompts, 'getInput');
		passwordStub = sinon.stub(getPrompts, 'getPassword');
		printStub = sinon.stub(console, 'log');
		processExitStub = sinon.stub(process, 'exit');
	});

	afterEach(() => {
		inputStub.restore();
		passwordStub.restore();
		printStub.restore();
		processExitStub.restore();
	});

	describe('getLSKPrivateKeyFromMnemonic', () => {
		it('should throw when mnemonic is not valid', async () => {
			inputStub.onCall(0).resolves(badMnemonic);

			await getLSKPrivateKeyFromMnemonic();
			expect(printStub.calledWith('Invalid Mnemonic, please check again.')).to.be.true;
			expect(processExitStub.calledWith(1)).to.be.true;
		});

		it('should get valid private key from mnemonic and path', async () => {
			inputStub.onCall(0).resolves(correctMnemonic);
			inputStub.onCall(1).resolves(lskPath);

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
			inputStub.onCall(0).resolves(privateKey.toString('hex') + 'f');
			await getLSKPrivateKeyFromString();

			expect(
				printStub.calledWith(
					'Invalid Private Key, please check again. Private Key should be 64 or 128 characters long.',
				),
			).to.be.true;
			expect(processExitStub.calledWith(1)).to.be.true;
		});

		it('should get valid 64-character-long private key with 0x prefix', async () => {
			inputStub.onCall(0).resolves('0x' + privateKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});

		it('should get valid 128-character-long private key with 0x prefix', async () => {
			inputStub.onCall(0).resolves('0x' + privateKey.toString('hex') + publicKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});

		it('should get valid 64-character-long private key without 0x', async () => {
			inputStub.onCall(0).resolves(privateKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});

		it('should get valid 128-character-long private key without 0x', async () => {
			inputStub.onCall(0).resolves(privateKey.toString('hex') + publicKey.toString('hex'));

			const promptPrivateKey = await getLSKPrivateKeyFromString();
			expect(promptPrivateKey).to.be.deep.eq(Buffer.concat([privateKey, publicKey]));
		});
	});

	describe('getETHWalletFromMnemonic', () => {
		it('should throw when mnemonic is not valid', async () => {
			inputStub.onCall(0).resolves(badMnemonic);

			await getETHWalletFromMnemonic();
			expect(printStub.calledWith('Invalid Mnemonic, please check again.')).to.be.true;
			expect(processExitStub.calledWith(1)).to.be.true;
		});

		it('should get valid private key from mnemonic, passphrase and path', async () => {
			const passphrase = 'foobar';

			inputStub.onCall(0).resolves(correctMnemonic);
			passwordStub.onCall(0).resolves(passphrase);
			inputStub.onCall(1).resolves(ethPath);

			const wallet = await getETHWalletFromMnemonic();

			// Verifiable at https://iancoleman.io/bip39
			expect(wallet).to.be.deep.eq(HDNodeWallet.fromPhrase(correctMnemonic, passphrase, ethPath));
		});
	});

	describe('getETHWalletKeyFromString', () => {
		const validPrivateKeyString = new Array(64).fill('e').join('');

		it('should throw when private key has invalid format', async () => {
			inputStub.onCall(0).resolves(validPrivateKeyString + 'f');
			await getETHWalletKeyFromString();

			expect(
				printStub.calledWith(
					'Invalid Private Key, please check again. Private Key should be 64-character long.',
				),
			).to.be.true;
			expect(processExitStub.calledWith(1)).to.be.true;
		});

		it('should get valid private key with 0x prefix', async () => {
			inputStub.onCall(0).resolves('0x' + validPrivateKeyString);

			const wallet = await getETHWalletKeyFromString();
			expect(wallet).to.be.deep.eq(new Wallet(validPrivateKeyString));
		});

		it('should get valid private key without 0x', async () => {
			inputStub.onCall(0).resolves(validPrivateKeyString);

			const wallet = await getETHWalletKeyFromString();
			expect(wallet).to.be.deep.eq(new Wallet(validPrivateKeyString));
		});
	});
});
