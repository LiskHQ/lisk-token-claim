import { expect, test } from '@oclif/test';

describe('hello world', () => {
	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['hello:world'])
		.it('runs hello world cmd', ctx => {
			expect(ctx.stdout).to.contain('hello world!');
		});
});
