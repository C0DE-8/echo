export const BLOCK_ERROR_CODES = [
  "INVALID_BLOCK_FORMAT",
  "INVALID_BLOCK_VERSION",
  "INVALID_BLOCK_NETWORK",
  "INVALID_BLOCK_HEIGHT",
  "INVALID_PREVIOUS_HASH",
  "INVALID_TIMESTAMP",
  "INVALID_TRANSACTION_ROOT",
  "INVALID_TRANSACTION_LIST",
  "INVALID_TRANSACTION",
  "DUPLICATE_TRANSACTION",
  "BLOCK_TOO_LARGE",
  "TOO_MANY_TRANSACTIONS",
  "TRANSACTION_TOO_LARGE",
  "NON_CANONICAL_ENCODING",
  "TRUNCATED_ENCODING",
  "EXCESS_BYTES"
] as const;

export type BlockErrorCode = (typeof BLOCK_ERROR_CODES)[number];

export type BlockValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly error: BlockErrorCode };

// Creates a successful block validation result by returning the shared valid shape.
export function validBlock(): BlockValidationResult {
  return Object.freeze({ valid: true });
}

// Creates a failed block validation result by attaching a deterministic block error code.
export function invalidBlock(error: BlockErrorCode): BlockValidationResult {
  return Object.freeze({ valid: false, error });
}
