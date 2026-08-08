# ECHO Address Format

## Summary

Phase 2 ECHO addresses use Bech32:

```text
human-readable network part + "1" + versioned payload + checksum
```

Bech32 was selected because it is a well-known cryptocurrency address encoding
with a human-readable prefix, strong typo detection for common input errors, no
mixed-case requirement, and built-in checksum handling.

## Public Key Input

The address input is the Ed25519 public key exported as SPKI PEM from Phase 1.
The raw public key is not exposed as the user-facing address.

## Hashing Steps

The address payload is:

```text
RIPEMD-160(SHA-256(publicKeyPem UTF-8 bytes))
```

This Bitcoin-inspired HASH160 construction creates a compact 20-byte payload
from the public key. It does not define transactions or balances.

## Version Field

The initial address version is:

```text
0
```

The version is encoded as the first Bech32 data value so future address payload
formats can be introduced without changing the entire address system.

## Network Identifier

The Bech32 human-readable part identifies the ECHO network:

```text
local    -> echolocal
testnet  -> echotest
mainnet  -> echo
```

The mainnet human-readable part is provisional until final mainnet launch
parameters are approved.

## Payload

The payload is 20 bytes. It is converted from 8-bit bytes into Bech32 five-bit
groups and placed after the version field.

## Checksum

The checksum is the standard six-character Bech32 checksum. It is calculated
over both the human-readable network part and the versioned payload, so the same
public key produces different valid addresses on different networks.

## Final Encoding

The final address is lowercase Bech32 text:

```text
echotest1...
```

Uppercase Bech32 may decode under the standard, but ECHO derives canonical
addresses as lowercase.

## Address Validation

Validation checks:

- Bech32 syntax and checksum
- known ECHO network prefix
- expected network when provided
- supported version
- 20-byte payload length

Invalid checksums, malformed text, unsupported versions, wrong networks, and
random strings are rejected.

## Mainnet And Testnet Separation

Network separation is part of the checksum because Bech32 includes the
human-readable part in checksum calculation. A testnet address cannot validate
as mainnet when the expected network is mainnet.

## Example Construction

```text
SPKI public key PEM
  -> UTF-8 bytes
  -> SHA-256 digest
  -> RIPEMD-160 digest
  -> prepend version 0
  -> Bech32 encode using echotest HRP
  -> echotest1...
```

TODO - PROTOCOL DECISION REQUIRED: final mainnet address namespace confirmation.
