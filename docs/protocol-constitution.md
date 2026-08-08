# ECHO Protocol Constitution

## Status

Phase 0 established the rules for developing ECHO. Phase 1 establishes the
cryptographic primitives future protocol phases will use.

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

The following decisions are intentionally unresolved after Phase 1:

- address format
- wallet seed and derivation standard
- transaction data model
- block data model
- genesis block contents
- exact halving interval
- difficulty-adjustment algorithm
- state model
- mempool policy
- P2P message formats
- fork choice rules
- persistence schema
- RPC methods

No implementation may assume answers to these decisions before the relevant
phase specifies them.
