import fs from 'fs';

export const readJson = async (fileName: string) => {
	try {
		return JSON.parse(await fs.promises.readFile(fileName, 'utf-8'));
	} catch (error) {
		throw new Error(`${fileName} does not exist or is not a proper JSON`);
	}
};
