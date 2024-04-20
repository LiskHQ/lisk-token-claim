export interface AuthAccount {
	nonce: bigint;
	numberOfSignatures: number;
	mandatoryKeys: Buffer[];
	optionalKeys: Buffer[];
}

export interface UserBalance {
	availableBalance: bigint;
	lockedBalances: {
		module: string;
		amount: bigint;
	}[];
}

export interface Account {
	lskAddress: string;
	balanceBeddows: string;
	numberOfSignatures?: number;
	mandatoryKeys?: string[];
	optionalKeys?: string[];
}

export interface AirdropAccount {
	lskAddress: string;
	balanceWei: string;
}

export interface Leaf {
	lskAddress: string;
	address: string;
	balanceBeddows: string;
	numberOfSignatures: number;
	mandatoryKeys: string[];
	optionalKeys: string[];
	hash: string;
	proof: string[];
}

export interface AirdropLeaf {
	lskAddress: string;
	address: string;
	balanceWei: string;
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
export interface ExampleKey {
	address: string;
	keyPath: string;
	publicKey: string;
	privateKey: string;
}
