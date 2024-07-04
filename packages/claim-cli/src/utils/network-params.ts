export interface NetworkParams {
	api: string;
	rpc: string;
	l2Claim: string;
	maxFeePerGas: bigint;
	maxPriorityFeePerGas: bigint;
}

export const Mainnet = {
	api: 'https://token-claim-api.lisk.com/rpc',
	rpc: 'https://rpc.api.lisk.com',
	l2Claim: '0xD7BE2Fd98BfD64c1dfCf6c013fC593eF09219994',
	maxFeePerGas: BigInt(1002060),
	maxPriorityFeePerGas: BigInt(1000000),
} as NetworkParams;

export const Testnet = {
	api: 'https://sepolia-token-claim-api.lisk.com/rpc',
	rpc: 'https://rpc.sepolia-api.lisk.com',
	l2Claim: '0x3D4190b08E3E30183f5AdE3A116f2534Ee3a4f94',
	maxFeePerGas: BigInt(1002060),
	maxPriorityFeePerGas: BigInt(1000000),
} as NetworkParams;
