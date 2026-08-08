import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPair, sign, verify } from "../../src/crypto/index.js";

// Verifies valid signatures by signing data and checking it with the matching public key.
function assertValidSignatureSucceeds(): void {
  const keyPair = generateKeyPair();
  const signature = sign("authorized", keyPair.privateKeyPem);

  assert.equal(verify("authorized", signature, keyPair.publicKeyPem), true);
}

// Verifies message integrity by checking that changed message bytes fail verification.
function assertModifiedMessageFails(): void {
  const keyPair = generateKeyPair();
  const signature = sign("authorized", keyPair.privateKeyPem);

  assert.equal(verify("unauthorized", signature, keyPair.publicKeyPem), false);
}

// Verifies signature integrity by flipping one hexadecimal nibble before verification.
function assertModifiedSignatureFails(): void {
  const keyPair = generateKeyPair();
  const signature = sign("authorized", keyPair.privateKeyPem);
  const replacement = signature[0] === "0" ? "1" : "0";
  const modifiedSignature = `${replacement}${signature.slice(1)}`;

  assert.equal(verify("authorized", modifiedSignature, keyPair.publicKeyPem), false);
}

// Verifies key ownership by checking that another key pair cannot verify the signature.
function assertWrongPublicKeyFails(): void {
  const signer = generateKeyPair();
  const other = generateKeyPair();
  const signature = sign("authorized", signer.privateKeyPem);

  assert.equal(verify("authorized", signature, other.publicKeyPem), false);
}

// Verifies empty message behavior by signing and verifying zero message bytes.
function assertEmptyMessageCanBeSigned(): void {
  const keyPair = generateKeyPair();
  const signature = sign("", keyPair.privateKeyPem);

  assert.equal(verify("", signature, keyPair.publicKeyPem), true);
}

// Verifies encoding determinism by comparing string input with equivalent UTF-8 bytes.
function assertStringAndBinaryEncodingAreDeterministic(): void {
  const keyPair = generateKeyPair();
  const data = "ECHO-π";
  const signature = sign(data, keyPair.privateKeyPem);

  assert.equal(verify(Buffer.from(data, "utf8"), signature, keyPair.publicKeyPem), true);
}

// Verifies repeated verification by checking the same signature more than once.
function assertRepeatedVerificationIsStable(): void {
  const keyPair = generateKeyPair();
  const signature = sign("repeatable", keyPair.privateKeyPem);

  assert.equal(verify("repeatable", signature, keyPair.publicKeyPem), true);
  assert.equal(verify("repeatable", signature, keyPair.publicKeyPem), true);
}

// Verifies malformed cryptographic data by checking invalid signatures and keys return false.
function assertMalformedDataFailsSafely(): void {
  const keyPair = generateKeyPair();

  assert.equal(verify("authorized", "not-hex", keyPair.publicKeyPem), false);
  assert.equal(verify("authorized", "abcd", "not-a-public-key"), false);
}

test("valid signature succeeds", assertValidSignatureSucceeds);
test("modified message fails verification", assertModifiedMessageFails);
test("modified signature fails verification", assertModifiedSignatureFails);
test("wrong public key fails verification", assertWrongPublicKeyFails);
test("empty message can be signed and verified", assertEmptyMessageCanBeSigned);
test("string and binary inputs use deterministic bytes", assertStringAndBinaryEncodingAreDeterministic);
test("repeated verification is stable", assertRepeatedVerificationIsStable);
test("malformed cryptographic data fails safely", assertMalformedDataFailsSafely);
