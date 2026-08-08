# ECHO

ECHO is an independent blockchain project implemented in TypeScript.

This repository is currently in **Phase 2 - Wallet and Address Foundation**. No
transaction, consensus, P2P, RPC, testnet, or real-money functionality is
implemented yet.

## Requirements

- Node.js 22+
- npm

## Commands

```sh
npm install
npm test
npm run build
```

## Project Rules

- The protocol specification is authoritative.
- Missing protocol decisions must be documented instead of silently chosen.
- Consensus-critical code must be deterministic and independently testable.
- Monetary values must use integer smallest-denomination units.
- Private keys, seed phrases, credentials, and production secrets must never be
  hardcoded or committed.

## Current Scope

Phase 0 established:

- project structure
- TypeScript tooling
- protocol metadata
- development-phase definitions
- unresolved decision tracking
- tests for the Phase 0 foundation

Phase 1 adds:

- SHA-256 hashing
- Ed25519 key generation
- Ed25519 signing and verification
- cryptography documentation and tests

Phase 2 adds:

- ECHO address derivation and validation
- local, testnet, and provisional mainnet address namespaces
- wallet creation
- wallet import from supported private-key PEM
- separated public and sensitive private wallet exports

## Phase Status

- Phase 0 - COMPLETE
- Phase 1 - COMPLETE
- Phase 2 - IN PROGRESS
