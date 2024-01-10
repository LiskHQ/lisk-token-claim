import * as fs from 'fs';
import { address, ed } from '@liskhq/lisk-cryptography';
import { ExampleKey } from '../../interface';

const initialPath = "m/44'/134'";

export async function createKeyPairs(amount = 100) {
	const keys: ExampleKey[] = [];
	for (let i = 0; i < amount; i++) {
		const keyPath = `${initialPath}/${i}'`;
		const privateKey = await ed.getPrivateKeyFromPhraseAndPath('lisk', keyPath);
		keys.push({
			address: address.getLisk32AddressFromAddress(address.getAddressFromPrivateKey(privateKey)),
			keyPath,
			publicKey: ed.getPublicKeyFromPrivateKey(privateKey).toString('hex'),
			privateKey: privateKey.toString('hex'),
		});
	}
	fs.writeFileSync('../../data/example/key-pairs.json', JSON.stringify(keys), 'utf-8');
}
