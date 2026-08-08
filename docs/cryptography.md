# ECHO Cryptography

## Why ECHO Needs Cryptography

ECHO will eventually use cryptography to identify coin owners, prove that a
transaction was authorized, link data to stable fingerprints, and let nodes
verify messages without trusting the sender. Phase 1 only provides the basic
cryptographic tools. It does not make a complete blockchain secure by itself.

## Hashing

A hash turns input data into a fixed-length fingerprint. ECHO currently uses
SHA-256 and represents hash output as lowercase hexadecimal text. The same input
bytes always produce the same hash, while even a one-byte change should produce
a very different-looking result.

Phase 1 hashing accepts strings as UTF-8 and binary data as bytes. It does not
add timestamps, random values, or hidden metadata.

## Public And Private Keys

A private key is secret key material used to create signatures. A public key is
derived from the private key and can be shared so other software can verify
signatures.

Phase 1 generates key pairs with Node.js's standard cryptographic APIs. Private
keys are exported as PKCS#8 PEM and public keys are exported as SPKI PEM. These
formats are implementation formats for the current learning implementation, not
wallet seed phrases or ECHO addresses.

## Digital Signatures

A digital signature proves that a holder of a private key signed specific data.
The verifier checks the data, signature, and public key together. Verification
succeeds only when the signature matches both the original data and the matching
public key.

Changing the message, changing the signature, or using a different public key
must make verification fail.

## Algorithms

Phase 1 uses:

- SHA-256 for hashing.
- Ed25519 for public/private key generation and digital signatures.

SHA-256 is selected because it is a mature standard hash function and is also
the approved Proof-of-Work hash algorithm for ECHO. Phase 1 does not implement
mining or difficulty adjustment.

Ed25519 is selected because it is a mature elliptic-curve signature system
supported directly by Node.js's standard `crypto` module. ECHO does not invent a
signature algorithm.

## Protocol Decisions And Implementation Details

Protocol decisions currently approved:

- ECHO is an independent blockchain.
- The native coin is ECHO.
- Maximum supply is 21,000,000 ECHO.
- One ECHO contains 100,000,000 atomic units.
- Consensus family is Proof of Work.
- Proof-of-Work hash algorithm is SHA-256.
- Target block interval is approximately 2 minutes.
- Initial block subsidy is 50 ECHO.
- Emission is Bitcoin-inspired halving.
- Premine is 0 ECHO.
- Creator allocation is 0 ECHO.
- Transaction fees are paid to the successful miner.
- Phase 1 uses SHA-256 and Ed25519.

Implementation details for Phase 1:

- String cryptographic input is encoded as UTF-8.
- Binary input is processed as its exact bytes.
- Hashes and signatures are represented as hexadecimal strings.
- Keys are represented as PEM strings.

Still unresolved:

- exact halving interval
- difficulty-adjustment algorithm
- address format
- wallet seed and derivation standard
- transaction and block formats

## Phase 2

Phase 2 will require wallet decisions before implementation, including how keys
are stored, how public keys become ECHO addresses, whether seed phrases are
used, and how wallet export/import avoids exposing private keys accidentally.
