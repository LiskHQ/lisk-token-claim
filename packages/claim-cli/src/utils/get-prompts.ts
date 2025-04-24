// Sets of helper function to be enable the use of `sinon.stub`

import { input, password } from '@inquirer/prompts';

export async function getInput(inputConfig: {
	message: string;
	default?: string;
}): Promise<string> {
	return input(inputConfig);
}

export async function getPassword(inputConfig: { message: string }): Promise<string> {
	return password(inputConfig);
}
