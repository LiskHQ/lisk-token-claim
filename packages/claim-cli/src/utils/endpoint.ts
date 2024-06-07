import {
	CheckEligibilityResponse,
	JSONRPCErrorResponse,
	JSONRPCSuccessResponse,
	SubmitMultisigResponse,
} from '../interfaces';
import { Network } from '../utils/network';

export const fetchCheckEligibility = async (
	lskAddress: string,
	network: Network,
): Promise<CheckEligibilityResponse> => {
	const jsonRPCRequest = {
		jsonrpc: '2.0',
		method: 'checkEligibility',
		params: {
			lskAddress,
		},
		id: 1,
	};

	const response = await fetch(network.api, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(jsonRPCRequest),
	});

	if (response.status !== 200) {
		console.log('Network Error, please try again later.');
		process.exit(1);
	}

	const { result, error } = (await response.json()) as
		| JSONRPCSuccessResponse<CheckEligibilityResponse>
		| JSONRPCErrorResponse;
	if (error) {
		console.log('Claim Endpoint returned error:', error.message);
		process.exit(1);
	}

	return result;
};

export const fetchSubmitMultisig = async (
	lskAddress: string,
	destination: string,
	publicKey: string,
	r: string,
	s: string,
	network: Network,
): Promise<SubmitMultisigResponse> => {
	const jsonRPCRequest = {
		jsonrpc: '2.0',
		method: 'submitMultisig',
		params: {
			lskAddress,
			destination,
			publicKey,
			r,
			s,
		},
		id: 1,
	};

	const response = await fetch(network.api, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(jsonRPCRequest),
	});

	if (response.status !== 200) {
		console.log('Network Error, please try again later.');
		process.exit(1);
	}

	const { result, error } = (await response.json()) as
		| JSONRPCSuccessResponse<SubmitMultisigResponse>
		| JSONRPCErrorResponse;
	if (error) {
		console.log('Claim Endpoint returned error:', error.message);
		process.exit(1);
	}

	return result;
};