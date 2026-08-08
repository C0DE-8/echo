import assert from "node:assert/strict";
import test from "node:test";
import { hash } from "../../src/crypto/index.js";

// Verifies deterministic hashing by hashing the same UTF-8 input twice.
function assertSameInputProducesSameHash(): void {
  assert.equal(hash("echo"), hash("echo"));
}

// Verifies hash sensitivity by comparing two inputs that differ by one byte.
function assertDifferentInputProducesDifferentHash(): void {
  assert.notEqual(hash("echo"), hash("echp"));
}

// Verifies SHA-256 compatibility by checking the standard abc test vector.
function assertKnownSha256Vector(): void {
  assert.equal(
    hash("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
}

// Verifies empty input hashing by checking the standard empty SHA-256 vector.
function assertEmptyInputHash(): void {
  assert.equal(
    hash(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
}

// Verifies Unicode hashing by comparing UTF-8 string input with the same explicit bytes.
function assertUnicodeInputUsesUtf8(): void {
  assert.equal(hash("ECHO-π"), hash(Buffer.from("ECHO-π", "utf8")));
}

test("same input produces the same hash", assertSameInputProducesSameHash);
test("different input produces a different hash", assertDifferentInputProducesDifferentHash);
test("known SHA-256 test vector matches", assertKnownSha256Vector);
test("empty input hashes deterministically", assertEmptyInputHash);
test("unicode input uses UTF-8 encoding", assertUnicodeInputUsesUtf8);
