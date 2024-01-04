export type Network = 'mainnet' | 'testnet' | 'example';
export interface Account {
	lskAddress: string;
	balance: number;
	balanceBeddows: number;
	numberOfSignatures?: number;
	mandatoryKeys?: string[];
	optionalKeys?: string[];
}

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
}

export interface MerkleTree {
	merkleRoot: string;
	leaves: Leaf[];
}

/*
 *** Not used in Mainnet ***
 */
export interface DevValidatorKey {
	address: string;
	keyPath: string;
	publicKey: string;
	privateKey: string;
	plain: {
		generatorKeyPath: string;
		generatorKey: string;
		generatorPrivateKey: string;
		blsKeyPath: string;
		blsKey: string;
		blsProofOfPossession: string;
		blsPrivateKey: string;
	};
	encrypted: {};
}

/*
 *** Not used in Mainnet ***
 */
export interface DevValidator {
	keys: DevValidatorKey[];
}
