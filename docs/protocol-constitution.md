# ECHO Protocol Constitution

## Status

Phase 0 establishes the rules for developing ECHO. It does not define chain
state, account format, transaction format, block format, consensus, networking,
storage, RPC, wallet behavior, supply, rewards, fees, or distribution.

## Project Identity

- Protocol name: ECHO
- Project type: independent blockchain network
- Native asset: ECHO coin
- Implementation language: TypeScript on Node.js

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

The following decisions are intentionally unresolved after Phase 0:

- smallest monetary denomination
- address format
- key type and signature scheme
- wallet seed and derivation standard
- transaction data model
- block data model
- genesis block contents
- consensus algorithm parameters
- proof-of-work hash function and difficulty rules
- coin supply, issuance, rewards, and fee policy
- state model
- mempool policy
- P2P message formats
- fork choice rules
- persistence schema
- RPC methods

No implementation may assume answers to these decisions before the relevant
phase specifies them.
