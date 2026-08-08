import type { EchoNetworkName } from "../wallet/index.js";

export const TRANSACTION_VERSION = 1;
export const ATOMIC_UNITS_PER_ECHO = 100000000n;
export const MAX_ECHO_SUPPLY = 21000000n;
export const MAX_ATOMIC_UNITS = MAX_ECHO_SUPPLY * ATOMIC_UNITS_PER_ECHO;
export const MAX_NONCE = 18446744073709551615n;

export type CanonicalInteger = string;

export type UnsignedTransaction = {
  readonly version: typeof TRANSACTION_VERSION;
  readonly network: EchoNetworkName;
  readonly sender: string;
  readonly senderPublicKey: string;
  readonly recipient: string;
  readonly amount: CanonicalInteger;
  readonly fee: CanonicalInteger;
  readonly nonce: CanonicalInteger;
};

export type SignedTransaction = UnsignedTransaction & {
  readonly signature: string;
};

export type CreateTransactionInput = {
  readonly network: EchoNetworkName;
  readonly sender: string;
  readonly senderPublicKey: string;
  readonly recipient: string;
  readonly amount: bigint | string;
  readonly fee: bigint | string;
  readonly nonce: bigint | string;
  readonly privateKeyPem: string;
};

// Converts an integer-like input into canonical decimal text by accepting only bigint or strict integer strings.
export function canonicalizeInteger(value: bigint | string): CanonicalInteger | undefined {
  if (typeof value === "bigint") {
    return value < 0n ? undefined : value.toString();
  }

  if (!isCanonicalIntegerString(value)) {
    return undefined;
  }

  return value;
}

// Parses a canonical integer string into bigint by validating its decimal representation first.
export function parseCanonicalInteger(value: string): bigint | undefined {
  if (!isCanonicalIntegerString(value)) {
    return undefined;
  }

  return BigInt(value);
}

// Checks canonical integer text by requiring decimal digits and rejecting leading zeroes except for zero itself.
export function isCanonicalIntegerString(value: string): boolean {
  return value === "0" || /^[1-9][0-9]*$/.test(value);
}
