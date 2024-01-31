export function append0x(input: string | Buffer): string {
	if (input instanceof Buffer) {
		input = input.toString('hex');
	}
	if (input.substring(0, 2) === '0x') {
		return input;
	}
	return '0x' + input;
}

export function remove0x(input: string): string {
	if (input.substring(0, 2) === '0x') {
		return input.substring(2);
	}
	return input;
}
