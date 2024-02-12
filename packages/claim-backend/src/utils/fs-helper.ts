import fs from 'fs';

export const fileExists = (fileName: string) => {
	return fs.existsSync(fileName);
};

export const readJson = (fileName: string) => {
	return JSON.parse(fs.readFileSync(fileName, 'utf-8'));
};
