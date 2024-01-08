import { expect, test } from '@oclif/test';

describe('GenerateMerkleTree', () => {
	test
		.loadConfig({ root: __dirname })
		.command(['generate-merkle-tree'])
		.catch(err => expect(err.message).to.contain('Missing required flag network'))
		.it('should reject when network not provided');

	test
		.loadConfig({ root: __dirname })
		.command(['generate-merkle-tree', '--network=foobar'])
		.catch(err =>
			expect(err.message).to.contain(
				'Expected --network=foobar to be one of: example, testnet, mainnet',
			),
		)
		.it('should reject when network not recognizable');

	test
		.loadConfig({ root: __dirname })
		.stdout()
		.command(['generate-merkle-tree', '--network=example'])
		.it('should run generate-merkle-tree with correct network', ctx => {
			expect(ctx.stdout).to.contain(`Success running GenerateMerkleTree (network=example)!`);
		});
});
