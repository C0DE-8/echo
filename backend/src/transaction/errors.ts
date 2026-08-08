export const TRANSACTION_ERROR_CODES = [
  "INVALID_FORMAT",
  "INVALID_VERSION",
  "INVALID_NETWORK",
  "INVALID_SENDER",
  "INVALID_RECIPIENT",
  "INVALID_PUBLIC_KEY",
  "INVALID_SIGNATURE",
  "INVALID_AMOUNT",
  "INVALID_FEE",
  "INVALID_NONCE",
  "FUTURE_NONCE",
  "INSUFFICIENT_BALANCE",
  "OVERFLOW"
] as const;

export type TransactionErrorCode = (typeof TRANSACTION_ERROR_CODES)[number];

export type TransactionValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly error: TransactionErrorCode };

// Creates a successful transaction validation result by returning the shared valid shape.
export function validTransaction(): TransactionValidationResult {
  return Object.freeze({ valid: true });
}

// Creates a failed transaction validation result by attaching a deterministic transaction error code.
export function invalidTransaction(error: TransactionErrorCode): TransactionValidationResult {
  return Object.freeze({ valid: false, error });
}
