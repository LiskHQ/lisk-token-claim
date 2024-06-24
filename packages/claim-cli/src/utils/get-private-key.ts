import { input, password, select } from '@inquirer/prompts';
import * as crypto from '@liskhq/lisk-cryptography';
import { HDNodeWallet, Wallet } from 'ethers';
import { remove0x } from './index';

enum SecretType {
	MNEMONIC,
	PRIVATE_KEY,
	JSON,
}

const getSecretType = (wallet: string) =>
	select({
		message: `Secret Type for ${wallet}`,
		choices: [
			{ name: 'Mnemonic', value: SecretType.MNEMONIC },
			{ name: 'Private Key', value: SecretType.PRIVATE_KEY },
		],
	});

export const getLSKPrivateKeyFromMnemonic = async (): Promise<Buffer> => {
	console.log(input);
	const mnemonic = await input({ message: 'Your Mnemonic' });
	const path = await input({ message: 'Path', default: "m/44'/134'/0'" });

	return crypto.ed.getPrivateKeyFromPhraseAndPath(mnemonic.trim(), path);
};

export const getLSKPrivateKeyFromString = async (): Promise<Buffer> => {
	const privKey = await input({
		message: 'Your Private Key',
	});

	const privKeyFormatted = remove0x(privKey);

	if (!privKeyFormatted.match(/^[A-Fa-f0-9]{128}$/)) {
		console.log(
			'Invalid Private Key, please check again. Private Key should be 128-character long',
		);
		process.exit(1);
	}
	return Buffer.from(privKeyFormatted, 'hex');
};

export const getLSKPrivateKey = async () => {
	const type = await getSecretType('Lisk L1 Wallet');
	return [getLSKPrivateKeyFromMnemonic, getLSKPrivateKeyFromString][type]();
};

export const getETHWalletFromMnemonic = async (): Promise<HDNodeWallet> => {
	const mnemonic = await input({ message: 'Your L2 Mnemonic' });
	const passphrase = await password({ message: 'BIP39 Passphrase (Optional)' });
	const path = await input({ message: 'Path', default: "m/44'/60'/0'/0/0" });

	return HDNodeWallet.fromPhrase(mnemonic, passphrase, path);
};

export const getETHWalletKeyFromString = async (): Promise<Wallet> => {
	const privKey = await input({
		message: 'Your Private Key',
	});

	const privKeyFormatted = remove0x(privKey);

	if (!privKeyFormatted.match(/^[A-Fa-f0-9]{64}$/)) {
		console.log('Invalid Private Key, please check again.');
		process.exit(1);
	}
	return new Wallet(privKey);
};

export const getETHWallet = async () => {
	const type = await getSecretType('Lisk L2 Wallet');
	return [getETHWalletFromMnemonic, getETHWalletKeyFromString][type]();
};
