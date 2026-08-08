# ECHO Runtime Block Foundation

## Status

The runtime block foundation is implemented. Echo can create deterministic block
objects in memory, serialize and deserialize them canonically, calculate
transaction commitments, calculate block IDs, and reject malformed blocks.

Echo still does not have a running blockchain, genesis activation, persistent
chain storage, mining, Proof-of-Work execution, difficulty adjustment, block
rewards, mempool, P2P networking, RPC, public network, or real-value coin
functionality.

## BlockHeaderV1

`BlockHeaderV1` contains exactly the Phase 4 header fields:

```text
version
network
height
previousHash
timestamp
transactionRoot
```

No mining nonce, difficulty target, coinbase commitment, or accumulated work
field exists in this phase.

## BlockV1

`BlockV1` contains:

```text
header
transactions[]
```

Transactions are existing signed V1 transactions. Their array order is
consensus-critical and is never sorted or silently changed by block creation.

## Canonical Encoding

Block header serialization:

```text
length-prefixed "ECHO_BLOCK_HEADER"
version as uint16 big-endian
length-prefixed network UTF-8 string
length-prefixed height canonical decimal ASCII string
length-prefixed previousHash lowercase hex string
length-prefixed timestamp canonical decimal ASCII string
length-prefixed transactionRoot lowercase hex string
```

Full block serialization:

```text
length-prefixed "ECHO_BLOCK"
length-prefixed canonical header bytes
length-prefixed canonical body bytes
```

Block body serialization:

```text
length-prefixed "ECHO_BLOCK_BODY"
transaction count as uint32 big-endian
for each transaction in array order:
  length-prefixed canonical signed transaction bytes
```

Decoders reject malformed magic, truncated bytes, and excess trailing bytes.

## Transaction Commitment

The transaction root is a SHA-256 Merkle root over ordered transaction IDs from
the existing transaction implementation.

Rules:

- Leaf hash: `SHA-256(transactionId bytes)`.
- Parent hash: `SHA-256(left child bytes || right child bytes)`.
- Odd tree levels duplicate the final hash.
- Empty blocks use `SHA-256("ECHO_EMPTY_TX_ROOT")`.
- Duplicate transaction IDs are structurally invalid inside one block.

## Block Hashing

The block ID is:

```text
SHA-256(canonical serialized block header bytes)
```

The block body is committed through `transactionRoot`; arbitrary JavaScript
objects and JSON strings are never hashed as block IDs.

## Structural Validation

Runtime structural validation checks:

- block object shape
- supported block version
- supported network
- canonical bounded height
- lowercase 64-character previous hash
- canonical bounded timestamp
- lowercase 64-character transaction root
- maximum transaction count
- maximum serialized transaction size
- duplicate transaction IDs
- stateless transaction validity
- transaction network matching
- recalculated transaction root
- maximum serialized block size

It intentionally does not check previous-block availability, height continuity
against a chain tip, timestamp drift against wall time, account-state execution
inside a chain, Proof of Work, difficulty adjustment, coinbase rewards, forks,
or reorgs.

## Consensus Invariants

- Deterministic functions do not use randomness or `Date.now()`.
- Block IDs depend only on canonical header bytes.
- Transaction roots depend on ordered transaction IDs.
- Serialization does not use `JSON.stringify()`.
- Non-canonical encoded data fails explicitly.
- Invalid blocks are not repaired or normalized.

## Test Vectors

The test suite contains permanent regression vectors for:

- known ordered transaction set
- expected transaction root
- expected canonical serialized header bytes
- expected block ID
- expected canonical full-block bytes

Unexpected changes to those values fail tests.
