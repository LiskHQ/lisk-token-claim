export interface Leaf {
	lskAddress: string;
	address: string;
	balanceBeddows: string;
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

export interface Signature {
	lskAddress: string;
	destination: string;
	signer: string;
	isOptional: boolean;
	r: string;
	s: string;
}

export interface AirdropLeaf {
	lskAddress: string;
	address: string;
	balanceWei: string;
	hash: string;
	proof: string[];
}
