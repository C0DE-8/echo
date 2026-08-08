# ECHO Transaction Implementation

## Scope

Phase 3 implements ECHO V1 transactions and an in-memory account state model for
execution tests. It does not implement blocks, blockchain persistence, mining,
Proof of Work, P2P networking, mempool storage, SQL, RPC, mainnet operation, or
real-money functionality.

## Architecture

Transaction code is organized under `src/transaction/`:

- `transaction.ts`: transaction types, constants, and canonical integer helpers.
- `serialization.ts`: deterministic unsigned and signed transaction
  serialization.
- `signing.ts`: transaction creation, signing payloads, transaction IDs, and
  stateless verification.
- `state.ts`: in-memory account state and atomic transaction execution.
- `errors.ts`: deterministic validation error codes.
- `validation.ts`: validation re-exports.
- `index.ts`: public transaction API.

The transaction module reuses Phase 1 cryptography and Phase 2 address
validation. It does not duplicate hashing, signing, key validation, or address
derivation.

## Transaction Structure

ECHO V1 signed transactions contain:

```text
version
network
sender
senderPublicKey
recipient
amount
fee
nonce
signature
```

`version` is `1`. `network` is `local`, `testnet`, or `mainnet`. `amount`,
`fee`, and `nonce` are canonical decimal integer strings. Monetary values are
atomic units, where:

```text
1 ECHO = 100,000,000 atomic units
```

## Serialization

Transactions use deterministic binary serialization. The implementation does
not use `JSON.stringify()` as a consensus format and does not rely on object
property order.

Unsigned signing payload serialization:

```text
length-prefixed "ECHO_TX"
version as uint16 big-endian
length-prefixed network UTF-8 string
length-prefixed sender UTF-8 string
length-prefixed senderPublicKey UTF-8 string
length-prefixed recipient UTF-8 string
length-prefixed amount canonical decimal string
length-prefixed fee canonical decimal string
length-prefixed nonce canonical decimal string
```

Signed transaction serialization appends:

```text
length-prefixed signature lowercase hex string
```

String lengths are unsigned 32-bit big-endian integers.

## Signing

`createTransaction(...)` builds unsigned fields, validates them, serializes the
unsigned transaction, and signs the resulting bytes with Ed25519 using the
explicit private key passed by the caller.

The signature does not sign itself. The signed fields are:

```text
version
network
sender
senderPublicKey
recipient
amount
fee
nonce
```

The transaction module never stores private keys.

## Transaction IDs

`getTransactionId(transaction)` returns:

```text
SHA-256(canonical signed transaction bytes)
```

The signature is included indirectly because the complete signed transaction is
serialized before hashing. No timestamps, random UUIDs, database IDs, or local
machine state are included.

## Validation

`verifyTransaction(...)` performs stateless validation:

```text
structure
version
network
sender address
sender public key
recipient address
sender address/public key binding
amount
fee
nonce
signature
```

Sender authentication requires:

```text
deriveAddress(senderPublicKey, network) === sender
verify(signingPayload, signature, senderPublicKey)
```

State-dependent validation happens separately during transaction application.

## Account State

`InMemoryAccountState` stores accounts in memory only:

```text
address
balance
nonce
```

Unseen accounts read as:

```text
balance = 0
nonce = 0
```

This is not blockchain state and is not persistent storage.

## State Transition

`applyTransaction(transaction, state)` validates the transaction and account
state before mutating anything.

Normal transfer:

```text
require senderBalance >= amount + fee
senderBalance -= amount + fee
recipientBalance += amount
senderNonce += 1
```

Self-transfer:

```text
require senderBalance >= amount + fee
senderBalance -= fee
senderNonce += 1
```

Fees are consumed in Phase 3. A later block execution phase must assign fees to
the successful miner.

## Atomicity

Execution is atomic. If stateless validation, nonce validation, balance checks,
or overflow checks fail, no account is modified.

## Nonce

New accounts start at nonce `0`. The first valid transaction uses nonce `1`.

Validation:

```text
transaction nonce < account nonce + 1 -> INVALID_NONCE
transaction nonce = account nonce + 1 -> executable
transaction nonce > account nonce + 1 -> FUTURE_NONCE
```

Phase 3 does not persist future-nonce transactions.

## Fees

Fees are integer atomic-unit values and may be zero in Phase 3. Fee is included
in the sender's total debit:

```text
totalDebit = amount + fee
```

Future network or mempool policy may impose relay fee requirements, but no
mempool policy exists in Phase 3.

## Error Handling

Validation returns deterministic error codes:

```text
INVALID_FORMAT
INVALID_VERSION
INVALID_NETWORK
INVALID_SENDER
INVALID_RECIPIENT
INVALID_PUBLIC_KEY
INVALID_SIGNATURE
INVALID_AMOUNT
INVALID_FEE
INVALID_NONCE
FUTURE_NONCE
INSUFFICIENT_BALANCE
OVERFLOW
```

Errors do not include private keys or sensitive wallet material.

## Remaining Boundaries

Phase 3 does not define block inclusion, miner fee crediting, mempool relay,
chain persistence, fork choice, or RPC submission. Those remain later-phase
protocol work.
