import * as fs from 'fs';
import { cryptography } from 'lisk-sdk';
import { ExampleKey } from '../../interface';

const initialPath = "m/44'/134'";

export async function createKeyPairs(amount = 100) {
	const keys: ExampleKey[] = [];
	for (let i = 0; i < amount; i++) {
		const keyPath = `${initialPath}/${i}'`;
		const privateKey = await cryptography.ed.getPrivateKeyFromPhraseAndPath('lisk', keyPath);
		keys.push({
			address: cryptography.address.getLisk32AddressFromAddress(
				cryptography.address.getAddressFromPrivateKey(privateKey),
			),
			keyPath,
			publicKey: cryptography.ed.getPublicKeyFromPrivateKey(privateKey).toString('hex'),
			privateKey: privateKey.toString('hex'),
		});
	}
	fs.writeFileSync('../../data/example/keyPairs.json', JSON.stringify(keys), 'utf-8');
}
