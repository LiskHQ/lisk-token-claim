export interface Balance {
	lskAddress: string;
	balance: number;
	numberOfSignatures: number;
	mandatoryKeys: string[];
	optionalKeys: string[];
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
	proof?: string[];
}

export interface Balances {
	merkleRoot: string;
	leaves: {
		lskAddress: string;
		address: string;
		balance: number;
		balanceBeddows: number;
		numberOfSignatures: number;
		mandatoryKeys: Array<string>;
		optionalKeys: Array<string>;
		payload: string;
		hash: string;
		proof: Array<string>;
	}[];
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
