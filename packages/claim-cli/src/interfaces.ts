export interface JSONRPCSuccessResponse<T> {
	jsonrpc: string;
	id: number;
	result: T;
	error: undefined;
}

export interface JSONRPCErrorResponse {
	jsonrpc: string;
	id: number;
	result: undefined;
	error: {
		code: number;
		message: string;
	};
}

export interface CheckEligibilityResponse {
	account: Account;
	multisigAccounts: Account[];
	signatures: Signature[];
}

export interface SubmitMultisigResponse {
	success: boolean;
	ready: boolean;
}

export interface Account {
	lskAddress: string;
	address: string;
	balanceBeddows: string;
	numberOfSignatures: number;
	mandatoryKeys: string[];
	optionalKeys: string[];
	hash: string;
	proof: string[];
	ready?: boolean;
}

export interface Signature {
	lskAddress: string;
	destination: string;
	signer: string;
	r: string;
	s: string;
}

export interface AccountListChoice {
	name: string;
	value: Account;
	claimed?: string;
}
