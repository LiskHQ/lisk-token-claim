import { computeStorePrefix } from './utils';

// 1 LSK = 10^8 Beddows
export const LSK_MULTIPLIER = 10 ** 8;

// Each leaf will be encoded in the following order:
// LSK_ADDRESS_IN_HEX: bytes20
// BALANCE_IN_BEDDOWS: uint64
// NUMBER_OF_SIGNATURES: uint32
// MANDATORY_KEYS: bytes32[]
// OPTIONAL_KEYS: bytes32[]
export const LEAF_ENCODING = ['bytes20', 'uint64', 'uint32', 'bytes32[]', 'bytes32[]'];

// moduleName = "token", substore prefix = "0x00"
export const TOKEN_PREFIX = Buffer.concat([computeStorePrefix('token'), Buffer.alloc(2, 0)]);

// moduleName = "auth", substore prefix = "0x00"
export const AUTH_PREFIX = Buffer.concat([computeStorePrefix('auth'), Buffer.alloc(2, 0)]);
