export interface Network {
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
	maxFeePerGas: 1002060n,
	maxPriorityFeePerGas: 1000000n,
} as Network;

export const Testnet = {
	api: 'https://token-claim-api.lisk.com/rpc',
	rpc: 'https://rpc.sepolia-api.lisk.com',
	l2Claim: '0xD7BE2Fd98BfD64c1dfCf6c013fC593eF09219994',
	maxFeePerGas: 1002060n,
	maxPriorityFeePerGas: 1000000n,
} as Network;

export const Local = {
	api: 'http://127.0.0.1:5555/rpc',
	rpc: 'http://127.0.0.1:8546',
	l2Claim: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
	maxFeePerGas: 1002060n,
	maxPriorityFeePerGas: 1000000n,
} as Network;
