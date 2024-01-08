import { expect, test } from '@oclif/test';

describe('Example', () => {
	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['example'])
		.it('should run example', ctx => {
			expect(ctx.stdout).to.contain('Success running example!');
		});
});
