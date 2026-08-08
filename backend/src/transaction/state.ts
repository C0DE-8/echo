import { verifyTransaction } from "./signing.js";
import { invalidTransaction, validTransaction, type TransactionValidationResult } from "./errors.js";
import { MAX_ATOMIC_UNITS, MAX_NONCE, parseCanonicalInteger, type SignedTransaction } from "./transaction.js";

export type Account = {
  readonly address: string;
  readonly balance: bigint;
  readonly nonce: bigint;
};

export type TransactionApplicationResult = TransactionValidationResult;

export class InMemoryAccountState {
  private readonly accounts = new Map<string, Account>();

  // Gets an account by returning stored state or a zero-balance zero-nonce default for unseen addresses.
  getAccount(address: string): Account {
    return this.accounts.get(address) ?? Object.freeze({ address, balance: 0n, nonce: 0n });
  }

  // Sets an account by validating non-negative bounded state and storing a frozen account copy by address.
  setAccount(account: Account): void {
    if (account.balance < 0n || account.balance > MAX_ATOMIC_UNITS || account.nonce < 0n || account.nonce > MAX_NONCE) {
      throw new Error("Unable to set invalid account state.");
    }

    this.accounts.set(account.address, Object.freeze({ ...account }));
  }
}

// Applies a signed transaction atomically by validating transaction and account state before mutating balances.
export function applyTransaction(
  transaction: SignedTransaction,
  state: InMemoryAccountState
): TransactionApplicationResult {
  const statelessValidation = verifyTransaction(transaction, transaction.network);

  if (!statelessValidation.valid) {
    return statelessValidation;
  }

  const stateValidation = validateTransactionAgainstState(transaction, state);

  if (!stateValidation.valid) {
    return stateValidation;
  }

  commitTransactionState(transaction, state);

  return validTransaction();
}

// Validates state-dependent transaction rules by checking nonce, balance, and arithmetic before mutation.
export function validateTransactionAgainstState(
  transaction: SignedTransaction,
  state: InMemoryAccountState
): TransactionValidationResult {
  const sender = state.getAccount(transaction.sender);
  const amount = parseCanonicalInteger(transaction.amount)!;
  const fee = parseCanonicalInteger(transaction.fee)!;
  const nonce = parseCanonicalInteger(transaction.nonce)!;
  const expectedNonce = sender.nonce + 1n;

  if (nonce < expectedNonce) {
    return invalidTransaction("INVALID_NONCE");
  }

  if (nonce > expectedNonce) {
    return invalidTransaction("FUTURE_NONCE");
  }

  if (sender.balance < amount + fee) {
    return invalidTransaction("INSUFFICIENT_BALANCE");
  }

  if (transaction.sender !== transaction.recipient) {
    const recipient = state.getAccount(transaction.recipient);

    if (recipient.balance + amount > MAX_ATOMIC_UNITS) {
      return invalidTransaction("OVERFLOW");
    }
  }

  return validTransaction();
}

// Commits transaction effects by updating sender and recipient accounts after all validation has succeeded.
function commitTransactionState(transaction: SignedTransaction, state: InMemoryAccountState): void {
  const sender = state.getAccount(transaction.sender);
  const amount = parseCanonicalInteger(transaction.amount)!;
  const fee = parseCanonicalInteger(transaction.fee)!;

  if (transaction.sender === transaction.recipient) {
    state.setAccount({ address: sender.address, balance: sender.balance - fee, nonce: sender.nonce + 1n });
    return;
  }

  const recipient = state.getAccount(transaction.recipient);

  state.setAccount({ address: sender.address, balance: sender.balance - amount - fee, nonce: sender.nonce + 1n });
  state.setAccount({ address: recipient.address, balance: recipient.balance + amount, nonce: recipient.nonce });
}
