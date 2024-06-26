import { select } from '@inquirer/prompts';
import * as crypto from '@liskhq/lisk-cryptography';
import { Mnemonic, HDNodeWallet, Wallet } from 'ethers';
import { remove0x } from './index';
import { getInput, getPassword } from './get-prompts';

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

export async function getLSKPrivateKeyFromMnemonic(): Promise<Buffer> {
	const mnemonic = await getInput({ message: 'Your Mnemonic' });
	if (!Mnemonic.isValidMnemonic(mnemonic)) {
		console.log('Invalid Mnemonic, please check again.');
		return process.exit(1);
	}

	const path = await getInput({ message: 'Path', default: "m/44'/134'/0'" });

	return crypto.ed.getPrivateKeyFromPhraseAndPath(mnemonic.trim(), path);
}

export async function getLSKPrivateKeyFromString(): Promise<Buffer> {
	const privKey = await getInput({
		message: 'Your Private Key',
	});

	const privKeyFormatted = remove0x(privKey);

	if (!privKeyFormatted.match(/^[A-Fa-f0-9]{128}$/)) {
		console.log(
			'Invalid Private Key, please check again. Private Key should be 128-character long.',
		);
		return process.exit(1);
	}
	return Buffer.from(privKeyFormatted, 'hex');
}

export async function getLSKPrivateKey() {
	const type = await getSecretType('Lisk L1 Wallet');
	return [getLSKPrivateKeyFromMnemonic, getLSKPrivateKeyFromString][type]();
}

export async function getETHWalletFromMnemonic(): Promise<HDNodeWallet> {
	const mnemonic = await getInput({ message: 'Your L2 Mnemonic' });
	if (!Mnemonic.isValidMnemonic(mnemonic)) {
		console.log('Invalid Mnemonic, please check again.');
		return process.exit(1);
	}

	const passphrase = await getPassword({ message: 'BIP39 Passphrase (Optional)' });
	const path = await getInput({ message: 'Path', default: "m/44'/60'/0'/0/0" });

	return HDNodeWallet.fromPhrase(mnemonic, passphrase, path);
}

export const getETHWalletKeyFromString = async (): Promise<Wallet> => {
	const privKey = await getInput({
		message: 'Your Private Key',
	});

	const privKeyFormatted = remove0x(privKey);

	if (!privKeyFormatted.match(/^[A-Fa-f0-9]{64}$/)) {
		console.log(
			'Invalid Private Key, please check again. Private Key should be 64-character long.',
		);
		return process.exit(1);
	}
	return new Wallet(privKey);
};

export const getETHWallet = async () => {
	const type = await getSecretType('Lisk L2 Wallet');
	return [getETHWalletFromMnemonic, getETHWalletKeyFromString][type]();
};
