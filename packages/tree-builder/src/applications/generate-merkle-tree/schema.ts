export const userBalanceSchema = {
	$id: '/token/store/user',
	type: 'object',
	required: ['availableBalance', 'lockedBalances'],
	properties: {
		availableBalance: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
		lockedBalances: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				required: ['module', 'amount'],
				properties: {
					module: {
						dataType: 'string',
						fieldNumber: 1,
						minLength: 1,
						maxLength: 32,
					},
					amount: {
						dataType: 'uint64',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};

export const authAccountSchema = {
	$id: '/auth/account',
	type: 'object',
	properties: {
		nonce: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
		numberOfSignatures: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
		mandatoryKeys: {
			type: 'array',
			items: {
				dataType: 'bytes',
			},
			fieldNumber: 3,
		},
		optionalKeys: {
			type: 'array',
			items: {
				dataType: 'bytes',
			},
			fieldNumber: 4,
		},
	},
	required: ['nonce', 'numberOfSignatures', 'mandatoryKeys', 'optionalKeys'],
};
