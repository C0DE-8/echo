import { hash, isValidPublicKey, sign, verify } from "../crypto/index.js";
import { deriveAddress, ECHO_NETWORKS, validateAddress, type EchoNetworkName } from "../wallet/index.js";
import { invalidTransaction, validTransaction, type TransactionValidationResult } from "./errors.js";
import { serializeSignedTransaction, serializeUnsignedTransaction } from "./serialization.js";
import {
  canonicalizeInteger,
  MAX_ATOMIC_UNITS,
  MAX_NONCE,
  parseCanonicalInteger,
  TRANSACTION_VERSION,
  type CreateTransactionInput,
  type SignedTransaction,
  type UnsignedTransaction
} from "./transaction.js";

// Creates a signed transaction by canonically serializing unsigned fields and signing them with Ed25519.
export function createTransaction(input: CreateTransactionInput): SignedTransaction {
  const amount = canonicalizeInteger(input.amount);
  const fee = canonicalizeInteger(input.fee);
  const nonce = canonicalizeInteger(input.nonce);

  if (amount === undefined || fee === undefined || nonce === undefined) {
    throw new Error("Unable to create transaction with invalid integer fields.");
  }

  const unsignedTransaction = Object.freeze({
    version: TRANSACTION_VERSION,
    network: input.network,
    sender: input.sender,
    senderPublicKey: input.senderPublicKey,
    recipient: input.recipient,
    amount,
    fee,
    nonce
  });
  const validation = validateUnsignedTransaction(unsignedTransaction);

  if (!validation.valid) {
    throw new Error(`Unable to create invalid transaction: ${validation.error}.`);
  }

  return Object.freeze({
    ...unsignedTransaction,
    signature: sign(getSigningPayload(unsignedTransaction), input.privateKeyPem)
  });
}

// Builds a signing payload by canonicalizing all signed transaction fields and excluding the signature.
export function getSigningPayload(transaction: UnsignedTransaction): Buffer {
  return serializeUnsignedTransaction(transaction);
}

// Computes a deterministic transaction ID by SHA-256 hashing canonical signed transaction bytes.
export function getTransactionId(transaction: SignedTransaction): string {
  return hash(serializeSignedTransaction(transaction));
}

// Verifies a signed transaction by checking structure, fields, address binding, and Ed25519 signature.
export function verifyTransaction(transaction: unknown, expectedNetwork?: EchoNetworkName): TransactionValidationResult {
  if (!isSignedTransactionShape(transaction)) {
    return invalidTransaction("INVALID_FORMAT");
  }

  const unsignedValidation = validateUnsignedTransaction(transaction, expectedNetwork);

  if (!unsignedValidation.valid) {
    return unsignedValidation;
  }

  if (!/^[0-9a-f]+$/.test(transaction.signature) || transaction.signature.length === 0) {
    return invalidTransaction("INVALID_SIGNATURE");
  }

  if (!verify(getSigningPayload(transaction), transaction.signature, transaction.senderPublicKey)) {
    return invalidTransaction("INVALID_SIGNATURE");
  }

  return validTransaction();
}

// Validates unsigned transaction fields by checking version, network, addresses, integers, and sender key binding.
function validateUnsignedTransaction(
  transaction: UnsignedTransaction,
  expectedNetwork?: EchoNetworkName
): TransactionValidationResult {
  if (transaction.version !== TRANSACTION_VERSION) {
    return invalidTransaction("INVALID_VERSION");
  }

  if (!Object.hasOwn(ECHO_NETWORKS, transaction.network) || expectedNetwork !== undefined && transaction.network !== expectedNetwork) {
    return invalidTransaction("INVALID_NETWORK");
  }

  if (!validateTransactionAddress(transaction.sender, transaction.network)) {
    return invalidTransaction("INVALID_SENDER");
  }

  if (!isValidPublicKey(transaction.senderPublicKey)) {
    return invalidTransaction("INVALID_PUBLIC_KEY");
  }

  if (!validateTransactionAddress(transaction.recipient, transaction.network)) {
    return invalidTransaction("INVALID_RECIPIENT");
  }

  if (!deriveAndCompareSender(transaction)) {
    return invalidTransaction("INVALID_SENDER");
  }

  return validateTransactionIntegers(transaction);
}

// Validates transaction integers by parsing canonical amount, fee, and nonce text with protocol bounds.
function validateTransactionIntegers(transaction: UnsignedTransaction): TransactionValidationResult {
  const amount = parseCanonicalInteger(transaction.amount);
  const fee = parseCanonicalInteger(transaction.fee);
  const nonce = parseCanonicalInteger(transaction.nonce);

  if (amount === undefined || amount === 0n) {
    return invalidTransaction("INVALID_AMOUNT");
  }

  if (fee === undefined) {
    return invalidTransaction("INVALID_FEE");
  }

  if (nonce === undefined || nonce === 0n) {
    return invalidTransaction("INVALID_NONCE");
  }

  if (amount > MAX_ATOMIC_UNITS || fee > MAX_ATOMIC_UNITS || nonce > MAX_NONCE || amount + fee > MAX_ATOMIC_UNITS) {
    return invalidTransaction("OVERFLOW");
  }

  return validTransaction();
}

// Validates a transaction address by decoding it on the expected network through the wallet address module.
function validateTransactionAddress(address: string, network: EchoNetworkName): boolean {
  return validateAddress(address, network);
}

// Verifies sender ownership by deriving an address from the public key and comparing it with the sender field.
function deriveAndCompareSender(transaction: UnsignedTransaction): boolean {
  try {
    return deriveAddress(transaction.senderPublicKey, transaction.network) === transaction.sender;
  } catch {
    return false;
  }
}

// Checks signed transaction shape by validating field names have the expected primitive TypeScript runtime types.
function isSignedTransactionShape(value: unknown): value is SignedTransaction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const transaction = value as Record<string, unknown>;

  return typeof transaction.version === "number"
    && typeof transaction.network === "string"
    && typeof transaction.sender === "string"
    && typeof transaction.senderPublicKey === "string"
    && typeof transaction.recipient === "string"
    && typeof transaction.amount === "string"
    && typeof transaction.fee === "string"
    && typeof transaction.nonce === "string"
    && typeof transaction.signature === "string";
}
