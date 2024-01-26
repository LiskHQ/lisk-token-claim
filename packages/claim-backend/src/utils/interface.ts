export type Network = 'mainnet' | 'testnet' | 'example';

export interface Leaf {
	lskAddress: string;
	address: string;
	balance: number;
	balanceBeddows: number;
	numberOfSignatures: number;
	mandatoryKeys: string[];
	optionalKeys: string[];
	hash: string;
	proof: string[];
	signatures?: {
		[destination: string]: {
			publicKey: string;
			r: string;
			s: string;
		}[];
	};
}

export interface MerkleTree {
	merkleRoot: string;
	leaves: Leaf[];
}
