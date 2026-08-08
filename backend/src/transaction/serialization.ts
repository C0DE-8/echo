import type { SignedTransaction, UnsignedTransaction } from "./transaction.js";

const TRANSACTION_MAGIC = "ECHO_TX";

const SIGNED_TRANSACTION_FIELDS = [
  "network",
  "sender",
  "senderPublicKey",
  "recipient",
  "amount",
  "fee",
  "nonce",
  "signature"
] as const;

const UNSIGNED_TRANSACTION_FIELDS = [
  "network",
  "sender",
  "senderPublicKey",
  "recipient",
  "amount",
  "fee",
  "nonce"
] as const;

// Serializes an unsigned transaction by writing magic, version, and fixed-order length-prefixed UTF-8 fields.
export function serializeUnsignedTransaction(transaction: UnsignedTransaction): Buffer {
  return serializeTransactionFields(transaction, UNSIGNED_TRANSACTION_FIELDS);
}

// Serializes a signed transaction by writing magic, version, fixed-order fields, and the signature field.
export function serializeSignedTransaction(transaction: SignedTransaction): Buffer {
  return serializeTransactionFields(transaction, SIGNED_TRANSACTION_FIELDS);
}

// Serializes transaction fields by concatenating deterministic buffers for magic, version, and named string fields.
function serializeTransactionFields<T extends UnsignedTransaction | SignedTransaction>(
  transaction: T,
  fields: readonly (keyof T)[]
): Buffer {
  const buffers = [encodeLengthPrefixedString(TRANSACTION_MAGIC), encodeUInt16(transaction.version)];

  for (const field of fields) {
    buffers.push(encodeLengthPrefixedString(String(transaction[field])));
  }

  return Buffer.concat(buffers);
}

// Encodes a string field by prefixing its UTF-8 bytes with an unsigned 32-bit big-endian length.
function encodeLengthPrefixedString(value: string): Buffer {
  const valueBuffer = Buffer.from(value, "utf8");
  const lengthBuffer = Buffer.alloc(4);

  lengthBuffer.writeUInt32BE(valueBuffer.length, 0);

  return Buffer.concat([lengthBuffer, valueBuffer]);
}

// Encodes a protocol version by writing it as an unsigned 16-bit big-endian integer.
function encodeUInt16(value: number): Buffer {
  const buffer = Buffer.alloc(2);

  buffer.writeUInt16BE(value, 0);

  return buffer;
}
