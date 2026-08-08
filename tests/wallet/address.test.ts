import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPair } from "../../src/crypto/index.js";
import { deriveAddress, validateAddress } from "../../src/wallet/index.js";

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

// Verifies deterministic address derivation by deriving the same network address twice from one public key.
function assertAddressDerivationIsDeterministic(): void {
  const keyPair = generateKeyPair();

  assert.equal(deriveAddress(keyPair.publicKeyPem, "testnet"), deriveAddress(keyPair.publicKeyPem, "testnet"));
}

// Verifies key separation by deriving addresses from two independently generated public keys.
function assertDifferentKeysProduceDifferentAddresses(): void {
  const first = generateKeyPair();
  const second = generateKeyPair();

  assert.notEqual(deriveAddress(first.publicKeyPem, "testnet"), deriveAddress(second.publicKeyPem, "testnet"));
}

// Verifies network separation by deriving addresses for the same key on local, testnet, and mainnet.
function assertDifferentNetworksProduceDifferentAddresses(): void {
  const keyPair = generateKeyPair();

  assert.notEqual(deriveAddress(keyPair.publicKeyPem, "local"), deriveAddress(keyPair.publicKeyPem, "testnet"));
  assert.notEqual(deriveAddress(keyPair.publicKeyPem, "testnet"), deriveAddress(keyPair.publicKeyPem, "mainnet"));
}

// Verifies valid address acceptance by validating a derived address against its expected network.
function assertValidAddressIsAccepted(): void {
  const keyPair = generateKeyPair();
  const address = deriveAddress(keyPair.publicKeyPem, "local");

  assert.equal(validateAddress(address, "local"), true);
}

// Verifies checksum protection by changing one character in a derived address.
function assertModifiedAddressIsRejected(): void {
  const keyPair = generateKeyPair();
  const address = deriveAddress(keyPair.publicKeyPem, "testnet");
  const separatorIndex = address.indexOf("1");
  const payloadIndex = separatorIndex + 2;
  const replacement = address[payloadIndex] === "q" ? "p" : "q";
  const modifiedAddress = `${address.slice(0, payloadIndex)}${replacement}${address.slice(payloadIndex + 1)}`;

  assert.equal(validateAddress(modifiedAddress, "testnet"), false);
}

// Verifies checksum rejection by changing only the final checksum character in a valid address.
function assertInvalidChecksumIsRejected(): void {
  const keyPair = generateKeyPair();
  const address = deriveAddress(keyPair.publicKeyPem, "testnet");
  const replacement = address.at(-1) === "q" ? "p" : "q";
  const invalidChecksumAddress = `${address.slice(0, -1)}${replacement}`;

  assert.equal(validateAddress(invalidChecksumAddress, "testnet"), false);
}

// Verifies malformed input rejection by validating empty text and random text.
function assertMalformedAddressIsRejected(): void {
  assert.equal(validateAddress("", "testnet"), false);
  assert.equal(validateAddress("not-an-echo-address", "testnet"), false);
}

// Verifies wrong-network rejection by validating a testnet address as mainnet.
function assertWrongNetworkIsRejected(): void {
  const keyPair = generateKeyPair();
  const address = deriveAddress(keyPair.publicKeyPem, "testnet");

  assert.equal(validateAddress(address, "mainnet"), false);
}

// Verifies unsupported version rejection by creating a checksummed address with version one.
function assertUnsupportedVersionIsRejected(): void {
  const address = createUnsupportedVersionAddress();

  assert.equal(validateAddress(address, "testnet"), false);
}

// Creates an unsupported-version Bech32 fixture by encoding version one with a valid checksum.
function createUnsupportedVersionAddress(): string {
  const payload = new Array<number>(32).fill(0);

  return bech32Encode("echotest", [1, ...payload]);
}

// Encodes Bech32 data for tests by appending the standard checksum and charset values.
function bech32Encode(humanReadablePart: string, data: readonly number[]): string {
  const checksum = createBech32Checksum(humanReadablePart, data);
  let encoded = `${humanReadablePart}1`;

  for (const value of [...data, ...checksum]) {
    encoded += BECH32_CHARSET[value];
  }

  return encoded;
}

// Creates a Bech32 checksum for tests by applying the BIP-173 polymod process.
function createBech32Checksum(humanReadablePart: string, data: readonly number[]): number[] {
  const values = [...expandBech32HumanReadablePart(humanReadablePart), ...data, 0, 0, 0, 0, 0, 0];
  const polymod = calculateBech32Polymod(values) ^ 1;
  const checksum: number[] = [];

  for (let index = 0; index < 6; index += 1) {
    checksum.push(polymod >> 5 * (5 - index) & 31);
  }

  return checksum;
}

// Expands a Bech32 HRP for tests by splitting characters into high and low five-bit groups.
function expandBech32HumanReadablePart(humanReadablePart: string): number[] {
  const expanded: number[] = [];

  for (const character of humanReadablePart) {
    expanded.push(character.charCodeAt(0) >> 5);
  }

  expanded.push(0);

  for (const character of humanReadablePart) {
    expanded.push(character.charCodeAt(0) & 31);
  }

  return expanded;
}

// Calculates Bech32 polymod for tests by applying generator constants to each data value.
function calculateBech32Polymod(values: readonly number[]): number {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let checksum = 1;

  for (const value of values) {
    const top = checksum >> 25;
    checksum = (checksum & 0x1ffffff) << 5 ^ value;

    for (let index = 0; index < generators.length; index += 1) {
      if ((top >> index & 1) === 1) {
        checksum ^= generators[index]!;
      }
    }
  }

  return checksum;
}

test("address derivation is deterministic", assertAddressDerivationIsDeterministic);
test("different keys produce different addresses", assertDifferentKeysProduceDifferentAddresses);
test("different networks produce different addresses", assertDifferentNetworksProduceDifferentAddresses);
test("valid address is accepted", assertValidAddressIsAccepted);
test("modified address is rejected", assertModifiedAddressIsRejected);
test("invalid checksum is rejected", assertInvalidChecksumIsRejected);
test("malformed address is rejected", assertMalformedAddressIsRejected);
test("wrong network is rejected", assertWrongNetworkIsRejected);
test("unsupported version is rejected", assertUnsupportedVersionIsRejected);
