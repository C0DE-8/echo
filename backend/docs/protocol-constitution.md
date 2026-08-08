# ECHO Protocol Constitution

## Status

Phase 0 established the rules for developing ECHO. Phase 1 established the
cryptographic primitives future protocol phases will use. Phase 2 established
wallet identity and deterministic address derivation. Phase 3 implemented V1
transactions with in-memory account state only. Phase 4 has a runtime block
foundation for deterministic block objects, serialization, hashing, transaction
commitments, and structural validation. Echo still does not have a running
blockchain.

- Phase 0 - COMPLETE
- Phase 1 - COMPLETE
- Phase 2 - COMPLETE
- Phase 3 - COMPLETE
- Phase 4 - RUNTIME BLOCK FOUNDATION COMPLETE

## Project Identity

- Protocol name: ECHO
- Project type: independent blockchain network
- Native asset: ECHO coin
- Implementation language: TypeScript on Node.js
- Maximum supply: 21,000,000 ECHO
- Smallest unit: 100,000,000 atomic units per ECHO
- Consensus family: Proof of Work
- Proof-of-Work hash algorithm: SHA-256
- Target block interval: approximately 2 minutes
- Initial block subsidy: 50 ECHO
- Emission model: Bitcoin-inspired halving
- Premine: 0 ECHO
- Creator allocation: 0 ECHO
- Transaction fees: paid to the successful miner
- Address encoding: Bech32
- Address payload: RIPEMD-160(SHA-256(SPKI public key PEM bytes))
- Address version: 0
- Address network identifiers: `echolocal`, `echotest`, and provisional `echo`
- Proposed transaction model: account-based state with address balance and nonce
- Transaction version: 1
- Transaction amount unit: atomic units as unsigned integer text
- Transaction ID: SHA-256 of canonical signed transaction bytes
- Block version: 1
- Block ID: SHA-256 of canonical block header bytes
- Transaction commitment: Merkle root of ordered transaction IDs
- Empty transaction root: SHA-256 of `ECHO_EMPTY_TX_ROOT`
- Provisional serialized block limit: 1,000,000 bytes
- Provisional transactions per block limit: 2,000
- Provisional serialized transaction limit inside blocks: 100,000 bytes

ECHO is not a token deployed on another blockchain.

## Development Principles

- Implement the protocol in explicit phases.
- Complete and test each phase before beginning the next phase.
- Treat written protocol specifications as authoritative.
- Stop and document missing protocol decisions instead of inventing behavior.
- Keep consensus-critical code deterministic, explicit, and testable.
- Avoid hidden global state and machine-specific behavior in protocol logic.
- Use integer smallest-denomination units for monetary values.
- Never store or log private keys, seed phrases, credentials, or production
  secrets in plaintext.

## Phase Order

1. Protocol Constitution
2. Cryptography
3. Wallet
4. Transactions
5. Blockchain
6. State / Ledger
7. Mempool
8. Consensus / Proof of Work
9. P2P Network
10. Node Software
11. Blockchain Synchronization
12. Forks and Chain Reorganization
13. Persistent Storage
14. RPC/API
15. Local Testnet
16. Public Testnet
17. Blockchain Explorer
18. Wallet Application
19. Distribution / Airdrop
20. Economics

## Current Unresolved Protocol Decisions

The following decisions remain unresolved after the runtime block foundation:

- wallet seed and derivation standard
- exact halving interval
- difficulty-adjustment algorithm
- state model
- mempool policy
- P2P message formats
- fork choice rules
- persistence schema
- RPC methods
- final mainnet address namespace confirmation
- encrypted wallet storage format
- TODO - PROTOCOL DECISION REQUIRED: wallet seed phrase standard
- TODO - PROTOCOL DECISION REQUIRED: hierarchical deterministic wallet derivation
- TODO - PROTOCOL DECISION REQUIRED: future minimum consensus fee rule
- TODO - PROTOCOL DECISION REQUIRED: future mempool nonce pending policy
- TODO - PROTOCOL DECISION REQUIRED: approve exact genesis timestamps per network
- TODO - PROTOCOL DECISION REQUIRED: approve timestamp drift rule before mining
- TODO - PROTOCOL DECISION REQUIRED: define mining reward and coinbase rules in a later phase

No implementation may assume answers to these decisions before the relevant
phase specifies them.
