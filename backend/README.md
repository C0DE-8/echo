# ECHO Backend

ECHO is an independent blockchain project written in TypeScript. It is not an
ERC-20 token, BEP-20 token, Solana token, or token deployed on another chain.

The backend currently contains cryptography, wallet/address foundations,
signed transactions, in-memory transaction execution, and protocol
documentation for blocks. It does not yet contain runtime blockchain storage,
mining, P2P networking, RPC, SQL persistence, public testnet, mainnet, or
real-money functionality.

## Status

- Phase 0 - Protocol foundation: COMPLETE
- Phase 1 - Cryptography: COMPLETE
- Phase 2 - Wallet and addresses: COMPLETE
- Phase 3 - Transactions: COMPLETE
- Phase 4 - Blockchain and block protocol: DESIGN IN PROGRESS

## What Exists

### Protocol Foundation

- Project rules and phase boundaries.
- Protocol constants and phase tracking.
- Explicit unresolved-decision tracking.
- Documentation-first workflow for consensus-critical rules.

### Cryptography

- SHA-256 hashing.
- Ed25519 key generation.
- Ed25519 signing and verification.
- SPKI PEM public keys.
- PKCS#8 PEM private keys.
- Lowercase hexadecimal hashes and signatures.

### Wallets And Addresses

- Wallet creation for `local`, `testnet`, and provisional `mainnet`.
- Wallet import from supported Ed25519 private-key PEM.
- Public wallet export without private key material.
- Explicit sensitive private wallet export.
- Bech32 ECHO addresses.
- Network-separated address prefixes:
  - `echolocal`
  - `echotest`
  - `echo`

### Transactions

- Account-based transaction model.
- Signed ECHO V1 transactions.
- Canonical transaction serialization.
- Deterministic transaction IDs.
- Sender/public-key/address binding.
- Network replay protection.
- Atomic-unit integer amounts and fees.
- Nonce validation.
- Zero-fee transactions.
- Self-transactions.
- In-memory account state for execution tests.
- Atomic transaction application.

### Block Protocol Design

- Proposed block header and body structure.
- Merkle transaction root design.
- Block ID design.
- Genesis, height, previous hash, timestamp, and block validation rules.
- Chain validation boundaries.
- Fork handling documented as future consensus work.

## What Does Not Exist Yet

- Runtime block implementation.
- Blockchain persistence.
- Mining.
- Proof-of-Work validation.
- Difficulty adjustment.
- Halving implementation.
- Coinbase or miner rewards.
- Mempool.
- P2P networking.
- RPC server.
- SQL storage.
- Public testnet or mainnet.
- Wallet UI.
- Airdrops, exchanges, withdrawals, banking, or fiat conversion.

## Monetary Rules Currently Documented

- Maximum supply: `21,000,000 ECHO`.
- Smallest unit: `1 ECHO = 100,000,000 atomic units`.
- Premine: `0 ECHO`.
- Creator allocation: `0 ECHO`.
- Initial block subsidy direction: `50 ECHO`.
- Transaction fees are intended to be paid to the successful miner in a later
  block/mining phase.

Exact halving interval, difficulty adjustment, coinbase transaction rules, and
miner reward execution are not implemented yet.

## Requirements

- Node.js 22+
- npm

## Setup

Run commands from this `backend/` directory:

```sh
npm install
npm test
npm run build
```

Current verification:

```text
54 tests passing
```

## Project Layout

```text
backend/
  docs/
  src/
    crypto/
    protocol/
    transaction/
    wallet/
  tests/
```

## Development Rules

- The protocol specification is authoritative.
- Missing protocol decisions must be documented instead of silently chosen.
- Consensus-critical code must be deterministic and independently testable.
- Monetary values must use integer smallest-denomination units.
- Do not use JavaScript floating-point arithmetic for protocol money.
- Do not store or log private keys in normal flows.
- Do not hardcode private keys, seed phrases, credentials, or production
  secrets.
- Do not implement future phases early.

## Key Documents

- [Protocol Constitution](docs/protocol-constitution.md)
- [Cryptography](docs/cryptography.md)
- [Address Format](docs/address-format.md)
- [Wallet Key Management](docs/wallet-key-management.md)
- [Transaction Protocol](docs/transaction-protocol.md)
- [Transaction Implementation](docs/transaction-implementation.md)
- [Block Protocol](docs/block-protocol.md)
