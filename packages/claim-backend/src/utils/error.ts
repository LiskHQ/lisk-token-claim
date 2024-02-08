export enum ErrorCode {
	ALREADY_SIGNED = 'ALREADY_SIGNED',
	INVALID_SIGNATURE = 'INVALID_SIGNATURE',
	INVALID_DESTINATION_ADDRESS = 'INVALID_DESTINATION_ADDRESS',
	INVALID_LSK_ADDRESS = 'INVALID_LSK_ADDRESS',
	PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS = 'PUBLIC_KEY_NOT_PART_OF_MULTISIG_ADDRESS',
	NUMBER_OF_SIGNATURES_REACHED = 'NUMBER_OF_SIGNATURES_REACHED',
}