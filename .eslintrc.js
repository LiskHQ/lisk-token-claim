/* eslint-env node */
module.exports = {
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-type-checked',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: [
			'./tsconfig.eslint.json',
			'./packages/*/tsconfig.json',
			'./packages/*/test/tsconfig.json',
		],
	},
	plugins: ['@typescript-eslint'],
	root: true,
	rules: {
		'@typescript-eslint/require-await': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-unsafe-return': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'off',
		'@typescript-eslint/no-unsafe-call': 'off',
		'@typescript-eslint/no-unsafe-argument': 'off',
	},
};
