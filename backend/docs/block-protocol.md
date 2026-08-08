# ECHO Block Protocol

## Status

Phase 4 began as a design phase. Echo now also has a runtime block foundation
for deterministic block objects, serialization, hashing, transaction roots, and
structural validation. Blockchain persistence, mining, Proof of Work validation,
mempool, P2P networking, SQL storage, RPC, and mainnet deployment are still not
implemented.

## Purpose

Phase 3 created valid signed transactions. Phase 4 defines how future nodes will
group transactions into deterministic blocks and connect those blocks into a
permanent ordered history:

```text
Transaction
  -> Block
  -> Block ID
  -> Next Block
  -> Blockchain
```

The block protocol defines the data that all nodes must validate. The mining
protocol will later define how a valid block is produced and selected.

## Block Model

Proposed ECHO V1 block:

```text
header
transactions[]
```

Proposed header fields:

```text
version
network
height
previousHash
timestamp
transactionRoot
```

Proof-of-Work fields such as mining nonce, compact target, accumulated work, and
difficulty-adjustment metadata are intentionally excluded from V1 base block
design until the mining phase approves them.

## Block Header

The block header identifies the block and commits to its body.

Field order:

```text
version
network
height
previousHash
timestamp
transactionRoot
```

`version`

- Type: unsigned integer.
- Encoding: unsigned 16-bit big-endian integer.
- Purpose: identifies the block format.
- V1 value: `1`.

`network`

- Type: string enum.
- Encoding: length-prefixed UTF-8 string.
- Purpose: prevents cross-network block replay.
- Valid values: `local`, `testnet`, `mainnet`.

`height`

- Type: unsigned integer.
- Encoding: canonical decimal ASCII integer string.
- Purpose: records position in the chain.
- Genesis value: `0`.

`previousHash`

- Type: lowercase hex string.
- Encoding: length-prefixed UTF-8 string.
- Purpose: links the block to its parent.
- Genesis value: 64 zero hex characters.

`timestamp`

- Type: unsigned integer Unix time in seconds.
- Encoding: canonical decimal ASCII integer string.
- Purpose: records proposed block time without JavaScript `Date` serialization.
- V1 rule: must be greater than or equal to the previous block timestamp and
  must not exceed the validator's current wall-clock time by more than the
  approved drift window.

`transactionRoot`

- Type: lowercase hex string.
- Encoding: length-prefixed UTF-8 string.
- Purpose: commits to the ordered transaction list.

## Block Body

The block body is an ordered transaction list:

```text
transactions[]
```

Rules:

- Order is consensus-critical.
- Block execution follows array order exactly.
- Duplicate transaction IDs are invalid within the same block.
- Transactions from the same sender must execute in valid nonce order relative
  to the prior state and earlier transactions in the block.
- A transaction with a future nonce may be valid for a mempool later, but it is
  invalid inside a block unless prior canonical state plus earlier block
  transactions make it executable.
- Arbitrary ordering is allowed only when every transaction remains valid when
  executed in that exact order.

## Transaction Root

ECHO V1 should use a Merkle tree over ordered transaction IDs.

Leaf hash:

```text
SHA-256(transactionId bytes)
```

`transactionId` is the lowercase hex transaction ID from Phase 3, decoded into
bytes before hashing.

Parent hash:

```text
SHA-256(left child bytes || right child bytes)
```

Odd leaf count:

```text
duplicate the final hash at that tree level
```

Empty transaction list:

```text
SHA-256("ECHO_EMPTY_TX_ROOT" UTF-8 bytes)
```

Ordering:

- Leaves follow the transaction array order exactly.
- Reordering transactions changes the Merkle root.
- Duplicate transaction IDs are rejected before root acceptance.

A Merkle tree is selected because it is a well-understood commitment scheme,
supports future transaction inclusion proofs, and commits to transaction order
without hashing the entire block body directly into the header.

## Block ID

The block ID is:

```text
SHA-256(canonical serialized block header bytes)
```

The block body is committed indirectly through `transactionRoot`. Hashing the
header is sufficient because the header commits to the ordered transaction list
through the Merkle root.

Block IDs must not use UUIDs, random values, timestamps outside the header,
database IDs, or local machine state.

## Block Serialization

Canonical block serialization must not use `JSON.stringify()` and must not rely
on JavaScript object property ordering.

Header serialization:

```text
length-prefixed "ECHO_BLOCK_HEADER"
version as uint16 big-endian
length-prefixed network UTF-8 string
length-prefixed height canonical decimal ASCII string
length-prefixed previousHash lowercase hex string
length-prefixed timestamp canonical decimal ASCII string
length-prefixed transactionRoot lowercase hex string
```

Body serialization:

```text
length-prefixed "ECHO_BLOCK_BODY"
transaction count as uint32 big-endian
for each transaction in array order:
  length-prefixed canonical signed transaction bytes
```

Full block serialization:

```text
length-prefixed "ECHO_BLOCK"
length-prefixed canonical header bytes
length-prefixed canonical body bytes
```

String lengths and byte lengths are unsigned 32-bit big-endian integers. Integer
text must be canonical decimal ASCII with no leading zeroes except `0`.

## Height Rules

Genesis block height is:

```text
0
```

The first normal block height is:

```text
1
```

For every non-genesis block:

```text
block.height === previousBlock.height + 1
```

Height is part of the block header because it is consensus-critical and prevents
ambiguous placement of the same previous hash in block validation.

## Previous Hash Rules

For non-genesis blocks:

```text
block.previousHash === previousBlock.blockId
```

For genesis blocks:

```text
previousHash = 0000000000000000000000000000000000000000000000000000000000000000
```

The genesis previous hash is encoded as a 64-character lowercase hex string, not
as `null`, an empty string, or an omitted field.

## Timestamp Rules

Timestamps use Unix time in seconds as unsigned integer text.

Proposed V1 rules:

- Timestamp is consensus-critical.
- Timestamp must be a canonical non-negative integer.
- Genesis timestamp is fixed per network.
- Non-genesis timestamp must be greater than or equal to previous block
  timestamp.
- Future timestamp allowance is provisional: no more than 2 hours ahead of the
  validating node's current wall-clock time.

The 2-hour drift value is a provisional pre-mining rule and must be reviewed
before mining and public testnet deployment.

## Genesis Block

Each network should have its own genesis block identity:

```text
local
testnet
mainnet
```

Proposed genesis fields:

```text
version = 1
network = selected network
height = 0
previousHash = 64 zero hex characters
timestamp = fixed approved genesis timestamp for that network
transactions = []
transactionRoot = empty transaction root
```

Genesis must not create arbitrary spendable ECHO unless issuance rules explicitly
approve it. There is no premine and no creator allocation in the current
protocol direction. Monetary issuance remains separate from block identity until
coinbase and mining rewards are approved.

TODO - PROTOCOL DECISION REQUIRED: approve exact genesis timestamps for local,
testnet, and mainnet.

## Initial State

Genesis block identity does not imply a premine. Initial account state starts
with no spendable balances unless a future issuance mechanism explicitly creates
coins.

Future state transition:

```text
previous state
  -> execute block transactions in order
  -> new state
```

Persistent state storage is not part of Phase 4.

## Block Validation Pipeline

Proposed deterministic validation order:

```text
1. Validate block structure.
2. Validate block version.
3. Validate network.
4. Validate height.
5. Validate previousHash format.
6. Validate previousHash relationship to previous block.
7. Validate timestamp.
8. Validate transaction list encoding and limits.
9. Validate duplicate transaction IDs are absent.
10. Recalculate transactionRoot.
11. Validate transactionRoot matches header.
12. Validate each transaction statelessly.
13. Execute transactions against staged state in array order.
14. Reject the block if any transaction fails.
15. Recalculate block ID from canonical header serialization.
16. Accept block as structurally valid if all checks pass.
```

Proof-of-Work validation is intentionally not included in Phase 4.

## Transaction Execution Inside Blocks

Transactions modify state in exact block order:

```text
previous state
  -> TX1
  -> state 1
  -> TX2
  -> state 2
  -> TX3
  -> state 3
```

If any transaction fails, the entire block is invalid. A validator must not skip
invalid transactions and keep the rest of the block.

## Nonce Rules Inside Blocks

Phase 4 uses the Phase 3 account nonce system.

If prior canonical state says an account nonce is `0`, a block may include nonce
`1` from that account. It may include nonce `2` from the same account later in
the same block only if nonce `1` was already executed earlier in that block.

A block containing nonce `2` without nonce `1` already present in prior state or
earlier in the same block is invalid.

## Duplicate Transactions

Duplicate transaction IDs are invalid within a block because including the same
transaction twice creates ambiguous commitment and execution behavior. Same-chain
replay across different blocks is prevented by account nonce state: once a
transaction nonce has executed, the same transaction becomes too low and fails.

## Block Size

Blocks must be bounded.

Provisional V1 limits:

```text
maximum serialized block size = 1,000,000 bytes
maximum transactions per block = 2,000
maximum serialized transaction size = 100,000 bytes
```

These limits are intentionally conservative for a learning implementation. They
must be reviewed with benchmarks before public testnet or mainnet.

TODO - PROTOCOL DECISION REQUIRED: approve final block and transaction size
limits.

## Empty Blocks

Empty blocks are valid in V1:

```text
transactions = []
```

They are useful for future mining and chain liveness even when no user
transactions are available. Empty blocks do not create rewards in Phase 4.
Mining rewards and coinbase transactions are future protocol work.

## Network Separation

The block `network` field is part of the header and block ID. Every transaction
inside a block must have the same network as the block. A local block cannot
validate on testnet or mainnet.

## Block Versioning

V1 blocks use:

```text
version = 1
```

Future block format upgrades must use explicit version changes. Nodes must
reject unsupported versions instead of guessing how to interpret them.

## Chain Validation

A future chain validator should verify:

```text
genesis correctness
height continuity
previousHash relationship
block IDs
transaction roots
transaction validity
transaction execution
state transitions
```

Chain validation starts at the approved genesis block for the selected network
and applies each connected block in order.

## Forks

Two individually valid blocks may exist at the same height with the same parent.
Phase 4 defines how to validate a block, not how to select the canonical chain.

Fork choice, accumulated work, chain reorganization, and consensus selection are
future Phase 7 and chain synchronization concerns.

## Mining Separation

Phase 4 does not define:

- mining reward
- Proof of Work validation
- difficulty target
- difficulty adjustment
- halving interval
- miner selection
- coinbase transaction format

Those rules belong to later mining and economics phases.

## Supply Constraint

Project-level maximum supply:

```text
21,000,000 ECHO
```

Phase 4 does not implement issuance, premine, genesis allocation, mining reward,
or halving. Exact issuance schedule, initial block reward mechanics, halving
interval, and coinbase rules must be approved before any runtime block
implementation mints coins.

# Block Protocol Decisions Awaiting Approval

- Approve ECHO V1 block header field set.
- Approve Merkle root transaction commitment rules.
- Approve empty transaction root constant.
- Approve block ID as SHA-256 of canonical header bytes.
- Approve block serialization format and length-prefix widths.
- Approve exact genesis timestamps for local, testnet, and mainnet.
- Approve 2-hour provisional future timestamp drift rule.
- Approve serialized block byte limit.
- Approve maximum transactions per block.
- Approve maximum serialized transaction size.
- Approve empty blocks as valid.
- Approve final block validation error categories before implementation.
- Define mining fields, rewards, coinbase, difficulty, and fork choice later.
