import assert from "node:assert/strict";
import test from "node:test";
import {
  createTransaction,
  createWallet,
  deriveAddress,
  exportPrivateWallet,
  getSigningPayload,
  getTransactionId,
  InMemoryAccountState,
  MAX_ATOMIC_UNITS,
  serializeSignedTransaction,
  verifyTransaction,
  applyTransaction,
  type SignedTransaction
} from "../../src/index.js";

type TestWallet = {
  readonly address: string;
  readonly publicKeyPem: string;
  readonly privateKeyPem: string;
};

// Creates a test wallet by generating an ECHO wallet and explicitly exporting its sensitive private key.
function createTestWallet(): TestWallet {
  const wallet = createWallet("testnet");
  const privateExport = exportPrivateWallet(wallet);

  return Object.freeze({
    address: wallet.address,
    publicKeyPem: wallet.publicKeyPem,
    privateKeyPem: privateExport.privateKeyPem
  });
}

// Creates a signed test transaction by filling standard wallet, amount, fee, and nonce fields.
function createTestTransaction(overrides: Partial<Parameters<typeof createTransaction>[0]> = {}): SignedTransaction {
  const sender = createTestWallet();
  const recipient = createTestWallet();

  return createTransaction({
    network: "testnet",
    sender: sender.address,
    senderPublicKey: sender.publicKeyPem,
    recipient: recipient.address,
    amount: "30",
    fee: "2",
    nonce: "1",
    privateKeyPem: sender.privateKeyPem,
    ...overrides
  });
}

// Clones a transaction with selected field overrides by copying the signed transaction shape.
function mutateTransaction(transaction: SignedTransaction, overrides: Partial<SignedTransaction>): SignedTransaction {
  return Object.freeze({ ...transaction, ...overrides });
}

// Verifies transaction creation by checking signature verification and transaction ID output.
function assertValidTransactionCreation(): void {
  const transaction = createTestTransaction();

  assert.equal(verifyTransaction(transaction).valid, true);
  assert.match(transaction.signature, /^[0-9a-f]+$/);
  assert.match(getTransactionId(transaction), /^[0-9a-f]{64}$/);
}

// Verifies signing payload determinism by comparing repeated canonical serialization of unsigned fields.
function assertSigningPayloadIsDeterministic(): void {
  const transaction = createTestTransaction();

  assert.deepEqual(getSigningPayload(transaction), getSigningPayload(transaction));
  assert.deepEqual(getSigningPayload(transaction), getSigningPayload(mutateTransaction(transaction, { signature: "00" })));
}

// Verifies transaction IDs by comparing identical transactions and transactions with changed signed or signature fields.
function assertTransactionIdRules(): void {
  const transaction = createTestTransaction();
  const sameTransaction = mutateTransaction(transaction, {});
  const changedAmount = mutateTransaction(transaction, { amount: "31" });
  const changedSignature = mutateTransaction(transaction, { signature: `00${transaction.signature.slice(2)}` });

  assert.equal(getTransactionId(transaction), getTransactionId(sameTransaction));
  assert.notEqual(getTransactionId(transaction), getTransactionId(changedAmount));
  assert.notEqual(getTransactionId(transaction), getTransactionId(changedSignature));
}

// Verifies canonical serialization by checking signed bytes are deterministic and include signature changes.
function assertSignedSerializationIsDeterministic(): void {
  const transaction = createTestTransaction();
  const changedSignature = mutateTransaction(transaction, { signature: `00${transaction.signature.slice(2)}` });

  assert.deepEqual(serializeSignedTransaction(transaction), serializeSignedTransaction(transaction));
  assert.notDeepEqual(serializeSignedTransaction(transaction), serializeSignedTransaction(changedSignature));
}

// Verifies tamper rejection by changing each signed field after signing and expecting verification failure.
function assertModifiedSignedFieldsFail(): void {
  const transaction = createTestTransaction();
  const recipient = createTestWallet();
  const sender = createTestWallet();
  const modifiedTransactions = [
    mutateTransaction(transaction, { amount: "31" }),
    mutateTransaction(transaction, { fee: "3" }),
    mutateTransaction(transaction, { nonce: "2" }),
    mutateTransaction(transaction, { recipient: recipient.address }),
    mutateTransaction(transaction, { sender: sender.address }),
    mutateTransaction(transaction, { network: "mainnet" }),
    mutateTransaction(transaction, { senderPublicKey: sender.publicKeyPem })
  ];

  for (const modifiedTransaction of modifiedTransactions) {
    assert.equal(verifyTransaction(modifiedTransaction).valid, false);
  }
}

// Verifies signature tamper rejection by changing one signature byte after transaction creation.
function assertModifiedSignatureFails(): void {
  const transaction = createTestTransaction();
  const modifiedTransaction = mutateTransaction(transaction, { signature: `00${transaction.signature.slice(2)}` });

  assert.equal(verifyTransaction(modifiedTransaction).valid, false);
}

// Verifies address binding by checking matching sender key succeeds and mismatched public key fails.
function assertAddressBindingRules(): void {
  const transaction = createTestTransaction();
  const other = createTestWallet();
  const mismatched = mutateTransaction(transaction, { senderPublicKey: other.publicKeyPem });

  assert.equal(verifyTransaction(transaction).valid, true);
  assert.deepEqual(verifyTransaction(mismatched), { valid: false, error: "INVALID_SENDER" });
}

// Verifies amount validation by checking positive amount succeeds and zero, invalid, and overflow values fail.
function assertAmountRules(): void {
  assert.equal(verifyTransaction(createTestTransaction({ amount: "1" })).valid, true);
  assert.throws(function createZeroAmount(): void {
    createTestTransaction({ amount: "0" });
  }, /INVALID_AMOUNT/);
  assert.throws(function createInvalidAmount(): void {
    createTestTransaction({ amount: "1.5" });
  }, /invalid integer fields/);
  assert.throws(function createOverflowAmount(): void {
    createTestTransaction({ amount: (MAX_ATOMIC_UNITS + 1n).toString() });
  }, /OVERFLOW/);
}

// Verifies fee validation by checking zero and positive fees succeed while negative fees fail.
function assertFeeRules(): void {
  assert.equal(verifyTransaction(createTestTransaction({ fee: "0" })).valid, true);
  assert.equal(verifyTransaction(createTestTransaction({ fee: "2" })).valid, true);
  assert.throws(function createNegativeFee(): void {
    createTestTransaction({ fee: "-1" });
  }, /invalid integer fields/);
}

// Verifies nonce validation by checking nonce one succeeds while nonce zero and future nonce are categorized.
function assertNonceRules(): void {
  const sender = createTestWallet();
  const recipient = createTestWallet();
  const state = new InMemoryAccountState();
  const first = createTestTransaction({
    sender: sender.address,
    senderPublicKey: sender.publicKeyPem,
    privateKeyPem: sender.privateKeyPem,
    recipient: recipient.address,
    nonce: "1"
  });
  const future = createTestTransaction({
    sender: sender.address,
    senderPublicKey: sender.publicKeyPem,
    privateKeyPem: sender.privateKeyPem,
    recipient: recipient.address,
    nonce: "3"
  });

  state.setAccount({ address: sender.address, balance: 100n, nonce: 0n });
  assert.equal(applyTransaction(first, state).valid, true);
  assert.throws(function createZeroNonce(): void {
    createTestTransaction({ nonce: "0" });
  }, /INVALID_NONCE/);
  assert.deepEqual(applyTransaction(first, state), { valid: false, error: "INVALID_NONCE" });
  assert.deepEqual(applyTransaction(future, state), { valid: false, error: "FUTURE_NONCE" });
}

// Verifies normal state execution by applying a transfer and checking sender and recipient balances.
function assertNormalStateExecution(): void {
  const sender = createTestWallet();
  const recipient = createTestWallet();
  const state = new InMemoryAccountState();
  const transaction = createTestTransaction({
    sender: sender.address,
    senderPublicKey: sender.publicKeyPem,
    privateKeyPem: sender.privateKeyPem,
    recipient: recipient.address,
    amount: "30",
    fee: "2",
    nonce: "1"
  });

  state.setAccount({ address: sender.address, balance: 100n, nonce: 0n });
  state.setAccount({ address: recipient.address, balance: 0n, nonce: 0n });
  assert.equal(applyTransaction(transaction, state).valid, true);
  assert.deepEqual(state.getAccount(sender.address), { address: sender.address, balance: 68n, nonce: 1n });
  assert.deepEqual(state.getAccount(recipient.address), { address: recipient.address, balance: 30n, nonce: 0n });
}

// Verifies self-transfer execution by applying only the fee debit and nonce increment to one account.
function assertSelfTransferExecution(): void {
  const sender = createTestWallet();
  const state = new InMemoryAccountState();
  const transaction = createTestTransaction({
    sender: sender.address,
    senderPublicKey: sender.publicKeyPem,
    privateKeyPem: sender.privateKeyPem,
    recipient: sender.address,
    amount: "30",
    fee: "2",
    nonce: "1"
  });

  state.setAccount({ address: sender.address, balance: 100n, nonce: 0n });
  assert.equal(applyTransaction(transaction, state).valid, true);
  assert.deepEqual(state.getAccount(sender.address), { address: sender.address, balance: 98n, nonce: 1n });
}

// Verifies atomicity by applying an insufficient-balance transaction and checking state remains unchanged.
function assertAtomicityOnFailure(): void {
  const sender = createTestWallet();
  const recipient = createTestWallet();
  const state = new InMemoryAccountState();
  const transaction = createTestTransaction({
    sender: sender.address,
    senderPublicKey: sender.publicKeyPem,
    privateKeyPem: sender.privateKeyPem,
    recipient: recipient.address,
    amount: "8",
    fee: "5",
    nonce: "1"
  });

  state.setAccount({ address: sender.address, balance: 10n, nonce: 0n });
  state.setAccount({ address: recipient.address, balance: 0n, nonce: 0n });
  assert.deepEqual(applyTransaction(transaction, state), { valid: false, error: "INSUFFICIENT_BALANCE" });
  assert.deepEqual(state.getAccount(sender.address), { address: sender.address, balance: 10n, nonce: 0n });
  assert.deepEqual(state.getAccount(recipient.address), { address: recipient.address, balance: 0n, nonce: 0n });
}

// Verifies network replay protection by validating a testnet transaction against mainnet.
function assertNetworkReplayProtection(): void {
  const transaction = createTestTransaction();

  assert.deepEqual(verifyTransaction(transaction, "mainnet"), { valid: false, error: "INVALID_NETWORK" });
}

// Verifies sender mismatch rejection by using a sender address derived for another network.
function assertSenderNetworkMismatchFails(): void {
  const sender = createTestWallet();
  const recipient = createTestWallet();
  const wrongNetworkSender = deriveAddress(sender.publicKeyPem, "mainnet");

  assert.throws(function createMismatchedSender(): void {
    createTestTransaction({
      sender: wrongNetworkSender,
      senderPublicKey: sender.publicKeyPem,
      privateKeyPem: sender.privateKeyPem,
      recipient: recipient.address
    });
  }, /INVALID_SENDER/);
}

test("valid transaction creation", assertValidTransactionCreation);
test("deterministic signing payload", assertSigningPayloadIsDeterministic);
test("transaction ID rules", assertTransactionIdRules);
test("deterministic signed serialization", assertSignedSerializationIsDeterministic);
test("modified signed fields fail", assertModifiedSignedFieldsFail);
test("modified signature fails", assertModifiedSignatureFails);
test("address binding rules", assertAddressBindingRules);
test("amount rules", assertAmountRules);
test("fee rules", assertFeeRules);
test("nonce rules", assertNonceRules);
test("normal state execution", assertNormalStateExecution);
test("self-transfer execution", assertSelfTransferExecution);
test("atomicity on failure", assertAtomicityOnFailure);
test("network replay protection", assertNetworkReplayProtection);
test("sender network mismatch fails", assertSenderNetworkMismatchFails);
