import { canonicalizeInteger, type SignedTransaction } from "../transaction/index.js";
import type { EchoNetworkName } from "../wallet/index.js";
import { calculateTransactionRoot } from "./merkle.js";

export const BLOCK_VERSION = 1;
export const GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
export const MAX_BLOCK_HEIGHT = 18446744073709551615n;
export const MAX_BLOCK_TIMESTAMP = 18446744073709551615n;
export const MAX_SERIALIZED_BLOCK_BYTES = 1000000;
export const MAX_TRANSACTIONS_PER_BLOCK = 2000;
export const MAX_SERIALIZED_TRANSACTION_BYTES = 100000;

export type BlockHeaderV1 = {
  readonly version: typeof BLOCK_VERSION;
  readonly network: EchoNetworkName;
  readonly height: string;
  readonly previousHash: string;
  readonly timestamp: string;
  readonly transactionRoot: string;
};

export type BlockV1 = {
  readonly header: BlockHeaderV1;
  readonly transactions: readonly SignedTransaction[];
};

export type CreateBlockInput = {
  readonly network: EchoNetworkName;
  readonly height: bigint | string;
  readonly previousHash: string;
  readonly timestamp: bigint | string;
  readonly transactions: readonly SignedTransaction[];
};

// Creates a V1 block by canonicalizing header integers and deriving the transaction root from ordered transactions.
export function createBlock(input: CreateBlockInput): BlockV1 {
  const height = canonicalizeInteger(input.height);
  const timestamp = canonicalizeInteger(input.timestamp);

  if (height === undefined || timestamp === undefined) {
    throw new Error("Unable to create block with invalid integer fields.");
  }

  return Object.freeze({
    header: Object.freeze({
      version: BLOCK_VERSION,
      network: input.network,
      height,
      previousHash: input.previousHash,
      timestamp,
      transactionRoot: calculateTransactionRoot(input.transactions)
    }),
    transactions: Object.freeze([...input.transactions])
  });
}
