const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = [
	{ ignores: ['dist'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.ts'],
		languageOptions: {
			ecmaVersion: 2022,
			globals: {
				...globals.node,
			},
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			'no-console': 'warn',
			'quotes': ['error', 'single'],
			'semi': ['error', 'always'],
		},
	},
];
