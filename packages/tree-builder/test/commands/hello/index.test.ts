import { expect, test } from '@oclif/test';

describe('hello', () => {
	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['hello', 'friend', '--from=oclif'])
		.it('runs hello cmd', ctx => {
			expect(ctx.stdout).to.contain('hello friend from oclif!');
		});
});
