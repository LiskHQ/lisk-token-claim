import { ethers } from 'ethers';

const INNER_WIDTH = 94;

function printCenter(text: string, fill = '─', width = INNER_WIDTH) {
	return text.padStart(width / 2 + text.length / 2, fill).padEnd(width, fill);
}

export function printPreview(lskAddress: string, l2Address: string, balanceBeddows: string) {
	const totalLSKString = `Total Amount: ${ethers.formatUnits(balanceBeddows, 8)} LSK`;

	console.log(`${printCenter('*** CLAIM PREVIEW ***', ' ', INNER_WIDTH + 2)}`);
	console.log(
		'┌─────────────── Lisk v4 ───────────────────────────────────────────── Lisk L2 ────────────────┐',
	);
	console.log(
		'│                                           │     │                                            │',
	);
	console.log(`│ ${lskAddress} │  →  │ ${l2Address} │`);
	console.log(
		'│                                           │     │                                            │',
	);
	console.log(
		'├──────────────────────────────────────────────────────────────────────────────────────────────┤',
	);
	console.log(`│${printCenter(totalLSKString, ' ')}│`);
	console.log(
		'└──────────────────────────────────────────────────────────────────────────────────────────────┘',
	);
}
