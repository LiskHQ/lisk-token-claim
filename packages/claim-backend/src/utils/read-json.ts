import fs from 'fs';

const fileExists = (fileName: string) => {
	return fs.existsSync(fileName);
};

const readJSON = (fileName: string) => {
	return JSON.parse(fs.readFileSync(fileName, 'utf-8'));
};

export { fileExists, readJSON };
