export function append0x(input: string): string {
	if (input.substring(0, 2) === '0x') {
		return input;
	}
	return '0x' + input;
}
