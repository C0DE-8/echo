import { serializeSignedTransaction, TRANSACTION_VERSION, type SignedTransaction } from "../transaction/index.js";
import { BLOCK_VERSION, type BlockHeaderV1, type BlockV1 } from "./block.js";

const BLOCK_HEADER_MAGIC = "ECHO_BLOCK_HEADER";
const BLOCK_BODY_MAGIC = "ECHO_BLOCK_BODY";
const BLOCK_MAGIC = "ECHO_BLOCK";

type Cursor = {
  readonly buffer: Buffer;
  offset: number;
};

// Serializes a block header by writing magic, version, and fixed-order length-prefixed UTF-8 fields.
export function serializeBlockHeader(header: BlockHeaderV1): Buffer {
  return Buffer.concat([
    encodeLengthPrefixedString(BLOCK_HEADER_MAGIC),
    encodeUInt16(header.version),
    encodeLengthPrefixedString(header.network),
    encodeLengthPrefixedString(header.height),
    encodeLengthPrefixedString(header.previousHash),
    encodeLengthPrefixedString(header.timestamp),
    encodeLengthPrefixedString(header.transactionRoot)
  ]);
}

// Serializes a full block by length-prefixing canonical header and body bytes under the block magic.
export function serializeBlock(block: BlockV1): Buffer {
  const headerBytes = serializeBlockHeader(block.header);
  const bodyBytes = serializeBlockBody(block.transactions);

  return Buffer.concat([
    encodeLengthPrefixedString(BLOCK_MAGIC),
    encodeLengthPrefixedBytes(headerBytes),
    encodeLengthPrefixedBytes(bodyBytes)
  ]);
}

// Deserializes a block header by reading exact canonical fields and rejecting truncated or excess bytes.
export function deserializeBlockHeader(bytes: Buffer): BlockHeaderV1 {
  const cursor = createCursor(bytes);
  const magic = readLengthPrefixedString(cursor);

  if (magic !== BLOCK_HEADER_MAGIC) {
    throw new Error("NON_CANONICAL_ENCODING");
  }

  const version = readUInt16(cursor);
  const network = readLengthPrefixedString(cursor);
  const height = readLengthPrefixedString(cursor);
  const previousHash = readLengthPrefixedString(cursor);
  const timestamp = readLengthPrefixedString(cursor);
  const transactionRoot = readLengthPrefixedString(cursor);

  requireFullyConsumed(cursor);

  if (version !== BLOCK_VERSION || !isEchoNetworkName(network)) {
    throw new Error("NON_CANONICAL_ENCODING");
  }

  return Object.freeze({ version, network, height, previousHash, timestamp, transactionRoot });
}

// Deserializes a full block by reading canonical header and body bytes and rejecting trailing data.
export function deserializeBlock(bytes: Buffer): BlockV1 {
  const cursor = createCursor(bytes);
  const magic = readLengthPrefixedString(cursor);

  if (magic !== BLOCK_MAGIC) {
    throw new Error("NON_CANONICAL_ENCODING");
  }

  const header = deserializeBlockHeader(readLengthPrefixedBytes(cursor));
  const transactions = deserializeBlockBody(readLengthPrefixedBytes(cursor));

  requireFullyConsumed(cursor);

  return Object.freeze({ header, transactions: Object.freeze(transactions) });
}

// Serializes a block body by writing magic, transaction count, and ordered signed transaction byte entries.
function serializeBlockBody(transactions: readonly SignedTransaction[]): Buffer {
  const buffers = [encodeLengthPrefixedString(BLOCK_BODY_MAGIC), encodeUInt32(transactions.length)];

  for (const transaction of transactions) {
    buffers.push(encodeLengthPrefixedBytes(serializeSignedTransaction(transaction)));
  }

  return Buffer.concat(buffers);
}

// Deserializes a block body by reading its magic, transaction count, and ordered transaction byte entries.
function deserializeBlockBody(bytes: Buffer): readonly SignedTransaction[] {
  const cursor = createCursor(bytes);
  const magic = readLengthPrefixedString(cursor);

  if (magic !== BLOCK_BODY_MAGIC) {
    throw new Error("NON_CANONICAL_ENCODING");
  }

  const count = readUInt32(cursor);
  const transactions: SignedTransaction[] = [];

  for (let index = 0; index < count; index += 1) {
    transactions.push(deserializeSignedTransaction(readLengthPrefixedBytes(cursor)));
  }

  requireFullyConsumed(cursor);

  return Object.freeze(transactions);
}

// Deserializes a signed transaction by reading the existing canonical transaction field order exactly.
function deserializeSignedTransaction(bytes: Buffer): SignedTransaction {
  const cursor = createCursor(bytes);
  const magic = readLengthPrefixedString(cursor);

  if (magic !== "ECHO_TX") {
    throw new Error("NON_CANONICAL_ENCODING");
  }

  const version = readUInt16(cursor);
  const network = readLengthPrefixedString(cursor);
  const sender = readLengthPrefixedString(cursor);
  const senderPublicKey = readLengthPrefixedString(cursor);
  const recipient = readLengthPrefixedString(cursor);
  const amount = readLengthPrefixedString(cursor);
  const fee = readLengthPrefixedString(cursor);
  const nonce = readLengthPrefixedString(cursor);
  const signature = readLengthPrefixedString(cursor);

  requireFullyConsumed(cursor);

  if (version !== TRANSACTION_VERSION || !isEchoNetworkName(network)) {
    throw new Error("NON_CANONICAL_ENCODING");
  }

  return Object.freeze({ version, network, sender, senderPublicKey, recipient, amount, fee, nonce, signature });
}

// Encodes a string field by prefixing its UTF-8 bytes with an unsigned 32-bit big-endian length.
function encodeLengthPrefixedString(value: string): Buffer {
  return encodeLengthPrefixedBytes(Buffer.from(value, "utf8"));
}

// Encodes a byte field by prefixing its bytes with an unsigned 32-bit big-endian length.
function encodeLengthPrefixedBytes(value: Buffer): Buffer {
  const lengthBuffer = encodeUInt32(value.length);

  return Buffer.concat([lengthBuffer, value]);
}

// Encodes a 16-bit unsigned integer in big-endian byte order.
function encodeUInt16(value: number): Buffer {
  const buffer = Buffer.alloc(2);

  buffer.writeUInt16BE(value, 0);

  return buffer;
}

// Encodes a 32-bit unsigned integer in big-endian byte order.
function encodeUInt32(value: number): Buffer {
  const buffer = Buffer.alloc(4);

  buffer.writeUInt32BE(value, 0);

  return buffer;
}

// Creates a cursor for deterministic byte parsing by tracking the current read offset.
function createCursor(buffer: Buffer): Cursor {
  return { buffer, offset: 0 };
}

// Reads a length-prefixed UTF-8 string by decoding the next length-prefixed bytes.
function readLengthPrefixedString(cursor: Cursor): string {
  return readLengthPrefixedBytes(cursor).toString("utf8");
}

// Reads length-prefixed bytes by consuming a uint32 length and exactly that many bytes.
function readLengthPrefixedBytes(cursor: Cursor): Buffer {
  const length = readUInt32(cursor);

  if (cursor.offset + length > cursor.buffer.length) {
    throw new Error("TRUNCATED_ENCODING");
  }

  const value = cursor.buffer.subarray(cursor.offset, cursor.offset + length);
  cursor.offset += length;

  return Buffer.from(value);
}

// Reads a 16-bit unsigned big-endian integer by consuming exactly two bytes from the cursor.
function readUInt16(cursor: Cursor): number {
  if (cursor.offset + 2 > cursor.buffer.length) {
    throw new Error("TRUNCATED_ENCODING");
  }

  const value = cursor.buffer.readUInt16BE(cursor.offset);
  cursor.offset += 2;

  return value;
}

// Reads a 32-bit unsigned big-endian integer by consuming exactly four bytes from the cursor.
function readUInt32(cursor: Cursor): number {
  if (cursor.offset + 4 > cursor.buffer.length) {
    throw new Error("TRUNCATED_ENCODING");
  }

  const value = cursor.buffer.readUInt32BE(cursor.offset);
  cursor.offset += 4;

  return value;
}

// Rejects non-canonical trailing bytes by requiring the cursor to be exactly at the buffer end.
function requireFullyConsumed(cursor: Cursor): void {
  if (cursor.offset !== cursor.buffer.length) {
    throw new Error("EXCESS_BYTES");
  }
}

// Checks whether parsed network text is one of the protocol-defined ECHO network names.
function isEchoNetworkName(value: string): value is "local" | "testnet" | "mainnet" {
  return value === "local" || value === "testnet" || value === "mainnet";
}
