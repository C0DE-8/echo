import assert from "node:assert/strict";
import test from "node:test";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { generateKeyPair, SIGNATURE_ALGORITHM, sign, verify } from "../../src/crypto/index.js";

// Verifies key generation by checking the documented Ed25519 PEM exports.
function assertKeyGenerationProducesPemKeys(): void {
  const keyPair = generateKeyPair();

  assert.equal(keyPair.algorithm, SIGNATURE_ALGORITHM);
  assert.match(keyPair.publicKeyPem, /^-----BEGIN PUBLIC KEY-----/);
  assert.match(keyPair.privateKeyPem, /^-----BEGIN PRIVATE KEY-----/);
}

// Verifies public/private relationship by signing data and verifying it with the paired public key.
function assertGeneratedKeyPairCanVerifyOwnSignature(): void {
  const keyPair = generateKeyPair();
  const signature = sign("phase-1", keyPair.privateKeyPem);

  assert.equal(verify("phase-1", signature, keyPair.publicKeyPem), true);
}

// Verifies generation uniqueness by comparing independently generated PEM key material.
function assertMultipleGeneratedKeyPairsAreDifferent(): void {
  const first = generateKeyPair();
  const second = generateKeyPair();

  assert.notEqual(first.publicKeyPem, second.publicKeyPem);
  assert.notEqual(first.privateKeyPem, second.privateKeyPem);
}

// Verifies exported key material can be parsed by Node's standard crypto key loaders.
function assertExportedKeysAreParseable(): void {
  const keyPair = generateKeyPair();

  assert.equal(createPublicKey(keyPair.publicKeyPem).asymmetricKeyType, "ed25519");
  assert.equal(createPrivateKey(keyPair.privateKeyPem).asymmetricKeyType, "ed25519");
}

test("generates Ed25519 PEM key pairs", assertKeyGenerationProducesPemKeys);
test("generated private key matches generated public key", assertGeneratedKeyPairCanVerifyOwnSignature);
test("multiple generated key pairs are different", assertMultipleGeneratedKeyPairsAreDifferent);
test("exported keys are parseable by Node crypto", assertExportedKeysAreParseable);
