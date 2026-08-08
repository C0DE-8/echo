# ECHO Transaction Protocol

## Status

Phase 3 is a design phase. This document specifies the proposed ECHO V1
transaction protocol, but no transaction runtime code exists yet.

## Proposed Transaction Model

ECHO V1 should use an account-based ledger model unless the protocol rejects
this proposal during approval.

Each account is keyed by an ECHO address and has:

```text
Address
Balance
Nonce
```

The balance is held in atomic units. The nonce is an unsigned integer that
orders transactions from that account and prevents replay.

Example:

```text
Alice balance = 100 ECHO
Alice nonce = 7

Alice sends 20 ECHO to Bob

Alice balance = 80 ECHO minus fee
Alice nonce = 8
Bob balance = 20 ECHO
```

## Account-Based Model Versus UTXO

An account-based model is simpler for ECHO V1 because each sender has one
balance and one nonce. This is easier to teach, inspect, and implement than
tracking many unspent outputs.

Compared with Bitcoin's UTXO model:

- Simplicity: accounts are easier to understand and map to wallet addresses.
- Security: nonces give replay protection, while UTXOs prevent replay by
  consuming specific outputs.
- Transaction ordering: accounts require strict per-sender nonce ordering.
  UTXOs can spend independent outputs in parallel.
- State management: accounts need current balance and nonce per address. UTXO
  systems need an indexed set of unspent outputs.
- Implementation complexity: account validation is lower complexity for an
  initial learning chain.
- Learning goals: account state is a better first implementation target for
  wallet, signing, and balance changes.
- Scalability: UTXO models can offer better parallel validation for independent
  outputs. Account models need careful handling of nonce queues and hot accounts.

No serious issue blocks account-based ECHO V1, so account-based state is the
working direction.

## Transaction Structure

Proposed V1 transaction fields:

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

`network`

- Type: string enum.
- Encoding: UTF-8 string from `local`, `testnet`, or `mainnet`.
- Purpose: prevents cross-network replay.
- Validation: must match the node's active network.
- Signed: yes.
- Affects transaction ID: yes.

`version`

- Type: unsigned integer.
- Encoding: fixed unsigned 16-bit integer.
- Purpose: identifies the transaction format.
- Validation: V1 transactions must use version `1`.
- Signed: yes.
- Affects transaction ID: yes.

`sender`

- Type: ECHO address string.
- Encoding: UTF-8 Bech32 string.
- Purpose: identifies the account to debit.
- Validation: valid address on the transaction network.
- Signed: yes.
- Affects transaction ID: yes.

`senderPublicKey`

- Type: Ed25519 SPKI PEM string.
- Encoding: UTF-8 string with length prefix.
- Purpose: lets nodes verify the signature and derive the sender address.
- Validation: valid Ed25519 public key; derived address must equal `sender`.
- Signed: yes.
- Affects transaction ID: yes.

`recipient`

- Type: ECHO address string.
- Encoding: UTF-8 Bech32 string.
- Purpose: identifies the account to credit.
- Validation: valid address on the transaction network.
- Signed: yes.
- Affects transaction ID: yes.

`amount`

- Type: unsigned integer atomic units.
- Encoding: decimal ASCII integer string with no leading plus sign, decimal
  point, exponent, separators, or leading zeroes except the value `0`.
- Purpose: amount transferred from sender to recipient.
- Validation: must be greater than zero.
- Signed: yes.
- Affects transaction ID: yes.

`fee`

- Type: unsigned integer atomic units.
- Encoding: decimal ASCII integer string with the same rules as `amount`.
- Purpose: fee eventually paid to the successful miner.
- Validation: must be greater than or equal to the consensus minimum fee.
- Signed: yes.
- Affects transaction ID: yes.

`nonce`

- Type: unsigned integer.
- Encoding: decimal ASCII integer string.
- Purpose: orders sender transactions and prevents replay.
- Validation: must match the expected next nonce for confirmed execution.
- Signed: yes.
- Affects transaction ID: yes.

`signature`

- Type: Ed25519 signature.
- Encoding: lowercase hexadecimal.
- Purpose: proves authorization by the sender private key.
- Validation: must verify against the canonical signing payload and
  `senderPublicKey`.
- Signed: no.
- Affects transaction ID: yes, through the final signed transaction ID.

## Monetary Units

One ECHO equals:

```text
100,000,000 atomic units
```

All amounts and fees are atomic-unit integers. JavaScript `number` is not
sufficient for all protocol monetary values because it is limited to safe
integers up to `9,007,199,254,740,991`, while ECHO maximum supply in atomic
units is:

```text
21,000,000 * 100,000,000 = 2,100,000,000,000,000
```

That maximum fits within JavaScript safe integers today, but protocol arithmetic
must use `bigint` or canonical integer strings so future extensions and all
intermediate checks remain deterministic and never use floating-point behavior.

## Transaction ID

The transaction ID should be:

```text
SHA-256(canonical serialized signed transaction bytes)
```

Conceptual process:

```text
transaction including signature
  -> canonical serialization
  -> SHA-256
  -> lowercase hexadecimal transaction ID
```

The ID is deterministic and independently reproducible by every node. It must
not use random UUIDs, local time, database IDs, or object memory identity.

## Canonical Serialization

Canonical serialization must be a protocol-defined byte format, not JavaScript
object property ordering and not unconstrained `JSON.stringify()`.

Proposed V1 byte format:

```text
magic: "ECHO_TX"
version: uint16 big-endian
network: length-prefixed UTF-8 string
sender: length-prefixed UTF-8 string
senderPublicKey: length-prefixed UTF-8 string
recipient: length-prefixed UTF-8 string
amount: length-prefixed canonical decimal ASCII integer string
fee: length-prefixed canonical decimal ASCII integer string
nonce: length-prefixed canonical decimal ASCII integer string
signature: length-prefixed lowercase hex string, omitted only for signing payload
```

Rules:

- Field order is exactly as listed.
- Integer binary fields use big-endian encoding.
- Monetary and nonce values use canonical decimal ASCII integer strings.
- Strings are UTF-8 with explicit length prefixes.
- Length prefixes are unsigned 32-bit big-endian integers.
- Optional fields are not allowed in V1.
- Unknown fields are invalid in V1.
- Canonical integer strings must not contain leading zeroes except `0`.
- Canonical hex strings must be lowercase and even-length.

## Signature Payload

The signature signs every transaction field except `signature`.

Signing payload:

```text
magic
version
network
sender
senderPublicKey
recipient
amount
fee
nonce
```

The signature must not sign itself. A node verifies by reconstructing the same
canonical signing payload and verifying the Ed25519 signature with
`senderPublicKey`.

## Sender Identity

The transaction should include:

```text
sender address
sender public key
signature
```

The public key cannot be derived from the address because the address payload is
a one-way hash of the public key. Therefore the transaction must carry the
sender public key so nodes can verify the signature.

Nodes must independently verify:

```text
deriveAddress(senderPublicKey, network) == sender
```

Then nodes verify the signature with `senderPublicKey`.

## Recipient

The recipient is an ECHO Bech32 address. It must validate on the transaction
network with the supported address version and a valid checksum.

Self-transactions are proposed to be allowed. They do not move net amount
between distinct accounts, but they consume nonce and fee. Their exact state
transition is defined below.

## Amount Rules

Amount rules:

- integer only
- atomic units only
- greater than zero
- no floating-point arithmetic
- no negative values
- no decimal points
- no exponent notation
- cannot exceed maximum supply in atomic units
- cannot exceed sender spendable balance after adding fee
- cannot overflow the selected integer representation

## Fee Rules

The `fee` field is part of the sender's total debit:

```text
totalDebit = amount + fee
```

Consensus fee rule proposal:

- Fee must be an integer atomic-unit value.
- Fee may be zero in V1 unless a minimum consensus fee is explicitly approved.
- Fee must not make `amount + fee` overflow.
- Fee is eventually credited to the successful miner by block processing.

Mempool fee policy is separate from consensus. Consensus defines what is valid
in a block. Mempool policy defines what an individual node chooses to relay or
hold before mining. A node may later reject zero-fee transactions from its
mempool while consensus could still allow them in a valid block, if that policy
is approved.

## Nonce Rules

Each account has a current confirmed nonce.

Proposed rule:

```text
valid next transaction nonce = account nonce + 1
```

Handling:

- Nonce too low: reject as replayed or already used.
- Nonce equal to expected next nonce: eligible for state validation.
- Nonce too high: not executable immediately.

Future mempool design may allow high-nonce transactions to wait in a pending
queue until earlier nonces arrive. This phase does not implement mempool
behavior.

## Balance Validation And State Transition

For a normal transaction where sender and recipient differ:

```text
require senderBalance >= amount + fee
senderBalance = senderBalance - amount - fee
recipientBalance = recipientBalance + amount
senderNonce = senderNonce + 1
```

Fee collection is not performed directly by this transfer. Later block
processing must define how all transaction fees in a block are credited to the
successful miner.

## Self-Transactions

Self-transactions are proposed to be allowed because they can serve future
account-management uses and are not inherently unsafe when fees and nonce are
handled exactly.

For `sender == recipient`:

```text
require senderBalance >= amount + fee
senderBalance = senderBalance - fee
senderNonce = senderNonce + 1
```

The amount is debited and credited to the same account, so the net account
balance change is only the fee. The amount must still be greater than zero.

## Zero-Value Transactions

`amount = 0` is proposed to be invalid in V1. Zero-value transfers increase
spam risk and provide no required function for the initial protocol. Future
special transaction types can be versioned if zero-value messages are needed.

## Overflow And Underflow

All arithmetic must use deterministic integer handling.

Protection rules:

- Reject negative balances, amounts, fees, and nonces.
- Reject amount or fee greater than maximum supply in atomic units.
- Reject `amount + fee` if it overflows the protocol integer limit.
- Reject sender balance underflow.
- Reject recipient balance overflow.
- Reject nonce overflow.
- Use explicit maximum values once account nonce bit width is approved.

## Transaction Validation Pipeline

Proposed validation order:

```text
Receive bytes
Deserialize canonical transaction
Validate no unknown or missing fields
Validate version
Validate network
Validate sender address
Validate recipient address
Validate amount encoding and range
Validate fee encoding and range
Validate nonce encoding and range
Validate sender public key format
Verify sender address derives from sender public key
Reconstruct canonical signing payload
Verify Ed25519 signature
Lookup sender state
Validate nonce against sender state
Validate spendable balance
Apply state transition or mark pending/rejected according to context
```

Structure and cryptographic checks should happen before state checks so invalid
transactions can be rejected without relying on current ledger state.

## Transaction States

Conceptual states:

- `created`: transaction fields exist locally but are not signed.
- `signed`: signature has been attached.
- `received`: node has received transaction bytes.
- `validated`: transaction passed stateless and stateful checks.
- `rejected`: transaction failed validation.
- `pending`: transaction is valid in structure but cannot execute yet, such as
  a future nonce waiting for earlier nonces.
- `confirmed`: transaction is included in the accepted chain state.

No database or mempool state is implemented in Phase 3.

## Transaction Malleability

Malleability protections:

- Canonical field order prevents alternate encodings of the same fields.
- Length-prefixed strings prevent ambiguous concatenation.
- Canonical integer strings prevent alternate forms such as `001`, `+1`, or
  `1.0`.
- Signature covers all semantic fields except itself.
- Transaction ID hashes the final signed canonical transaction.
- Sender public key must derive to sender address.

Changing any signed field invalidates the signature. Changing only the signature
changes the transaction ID and must still verify against the signing payload.

## Replay Protection

Account nonce prevents same-network replay. Once nonce `n` has been accepted for
an account, another transaction with nonce `n` is too low and must be rejected.

Cross-network replay is prevented by including `network` in the signed payload
and validating that both sender and recipient addresses belong to that network.
A valid local transaction must not validate on testnet or mainnet.

## Protocol Errors

Rejection categories:

```text
INVALID_FORMAT
INVALID_NETWORK
INVALID_ADDRESS
INVALID_SIGNATURE
INVALID_PUBLIC_KEY
INVALID_AMOUNT
INVALID_FEE
INVALID_NONCE
INSUFFICIENT_BALANCE
INVALID_VERSION
INVALID_SENDER
UNSUPPORTED_TRANSACTION_TYPE
ARITHMETIC_OVERFLOW
```

Errors must not expose private keys or sensitive wallet material.

## Transaction Versioning

V1 transactions use:

```text
version = 1
```

Old nodes should reject unsupported versions instead of guessing. Future
versions may define new fields, serialization rules, transaction types, or fee
rules. Version changes must be explicit protocol upgrades.

# Transaction Protocol Decisions Awaiting Approval

- Approve account-based ledger model for ECHO V1.
- Approve including `network` in every signed transaction.
- Approve transaction field set: `version`, `network`, `sender`,
  `senderPublicKey`, `recipient`, `amount`, `fee`, `nonce`, `signature`.
- Approve canonical byte serialization format and length-prefix sizes.
- Approve transaction ID as SHA-256 of signed canonical transaction bytes.
- Approve signing payload as all fields except `signature`.
- Approve public-key-in-transaction sender authorization model.
- Approve `bigint` or canonical integer string handling for implementation.
- Approve whether V1 consensus permits zero fee.
- Approve any V1 minimum consensus fee, if zero fee is rejected.
- Approve nonce rule: expected next nonce equals account nonce plus one.
- Approve whether high-nonce transactions may be pending in future mempools.
- Approve self-transactions as valid with net balance change equal to fee only.
- Approve zero-value transaction rejection.
- Approve protocol integer limits for balances and nonces.
- Approve final transaction rejection code names.
