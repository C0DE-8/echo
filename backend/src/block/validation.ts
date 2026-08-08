import { ECHO_NETWORKS } from "../wallet/index.js";
import {
  getTransactionId,
  isCanonicalIntegerString,
  parseCanonicalInteger,
  serializeSignedTransaction,
  verifyTransaction
} from "../transaction/index.js";
import {
  BLOCK_VERSION,
  MAX_BLOCK_HEIGHT,
  MAX_BLOCK_TIMESTAMP,
  MAX_SERIALIZED_BLOCK_BYTES,
  MAX_SERIALIZED_TRANSACTION_BYTES,
  MAX_TRANSACTIONS_PER_BLOCK,
  type BlockHeaderV1,
  type BlockV1
} from "./block.js";
import { invalidBlock, validBlock, type BlockValidationResult } from "./errors.js";
import { calculateTransactionRoot } from "./merkle.js";
import { serializeBlock } from "./serialization.js";

// Structurally validates a block by checking header fields, transaction list, commitment, duplicates, and size bounds.
export function validateBlockStructure(block: unknown): BlockValidationResult {
  if (!isBlockShape(block)) {
    return invalidBlock("INVALID_BLOCK_FORMAT");
  }

  const headerValidation = validateBlockHeaderStructure(block.header);

  if (!headerValidation.valid) {
    return headerValidation;
  }

  if (block.transactions.length > MAX_TRANSACTIONS_PER_BLOCK) {
    return invalidBlock("TOO_MANY_TRANSACTIONS");
  }

  const transactionValidation = validateBlockTransactions(block);

  if (!transactionValidation.valid) {
    return transactionValidation;
  }

  if (calculateTransactionRoot(block.transactions) !== block.header.transactionRoot) {
    return invalidBlock("INVALID_TRANSACTION_ROOT");
  }

  if (serializeBlock(block).length > MAX_SERIALIZED_BLOCK_BYTES) {
    return invalidBlock("BLOCK_TOO_LARGE");
  }

  return validBlock();
}

// Structurally validates a block header by checking version, network, integer fields, and hash field formats.
export function validateBlockHeaderStructure(header: unknown): BlockValidationResult {
  if (!isBlockHeaderShape(header)) {
    return invalidBlock("INVALID_BLOCK_FORMAT");
  }

  if (header.version !== BLOCK_VERSION) {
    return invalidBlock("INVALID_BLOCK_VERSION");
  }

  if (!Object.hasOwn(ECHO_NETWORKS, header.network)) {
    return invalidBlock("INVALID_BLOCK_NETWORK");
  }

  if (!isCanonicalBoundedInteger(header.height, MAX_BLOCK_HEIGHT)) {
    return invalidBlock("INVALID_BLOCK_HEIGHT");
  }

  if (!isLowercaseHash(header.previousHash)) {
    return invalidBlock("INVALID_PREVIOUS_HASH");
  }

  if (!isCanonicalBoundedInteger(header.timestamp, MAX_BLOCK_TIMESTAMP)) {
    return invalidBlock("INVALID_TIMESTAMP");
  }

  if (!isLowercaseHash(header.transactionRoot)) {
    return invalidBlock("INVALID_TRANSACTION_ROOT");
  }

  return validBlock();
}

// Validates block transactions by checking transaction validity, network matching, byte size, and duplicate IDs.
function validateBlockTransactions(block: BlockV1): BlockValidationResult {
  const transactionIds = new Set<string>();

  for (const transaction of block.transactions) {
    if (serializeSignedTransaction(transaction).length > MAX_SERIALIZED_TRANSACTION_BYTES) {
      return invalidBlock("TRANSACTION_TOO_LARGE");
    }

    const transactionValidation = verifyTransaction(transaction, block.header.network);

    if (!transactionValidation.valid) {
      return invalidBlock("INVALID_TRANSACTION");
    }

    const transactionId = getTransactionId(transaction);

    if (transactionIds.has(transactionId)) {
      return invalidBlock("DUPLICATE_TRANSACTION");
    }

    transactionIds.add(transactionId);
  }

  return validBlock();
}

// Checks block shape by validating header shape and that transactions is an array.
function isBlockShape(value: unknown): value is BlockV1 {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const block = value as { readonly header?: unknown; readonly transactions?: unknown };

  return isBlockHeaderShape(block.header) && Array.isArray(block.transactions);
}

// Checks block header shape by validating each header field has the expected primitive runtime type.
function isBlockHeaderShape(value: unknown): value is BlockHeaderV1 {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const header = value as Record<string, unknown>;

  return typeof header.version === "number"
    && typeof header.network === "string"
    && typeof header.height === "string"
    && typeof header.previousHash === "string"
    && typeof header.timestamp === "string"
    && typeof header.transactionRoot === "string";
}

// Checks a canonical integer string by parsing it and comparing it with an inclusive upper bound.
function isCanonicalBoundedInteger(value: string, maximum: bigint): boolean {
  if (!isCanonicalIntegerString(value)) {
    return false;
  }

  const parsed = parseCanonicalInteger(value);

  return parsed !== undefined && parsed <= maximum;
}

// Checks lowercase SHA-256 hash text by requiring exactly 64 lowercase hexadecimal characters.
function isLowercaseHash(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
