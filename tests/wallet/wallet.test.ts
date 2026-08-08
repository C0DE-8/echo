import assert from "node:assert/strict";
import test from "node:test";
import {
  createWallet,
  exportPrivateWallet,
  exportPublicWallet,
  importWallet,
  validateAddress,
  WALLET_VERSION
} from "../../src/wallet/index.js";

// Verifies wallet creation by checking public fields and explicit sensitive export material.
function assertWalletGeneratesSuccessfully(): void {
  const wallet = createWallet("local");
  const privateExport = exportPrivateWallet(wallet);

  assert.equal(wallet.version, WALLET_VERSION);
  assert.equal(wallet.network, "local");
  assert.match(wallet.publicKeyPem, /^-----BEGIN PUBLIC KEY-----/);
  assert.match(wallet.address, /^echolocal1/);
  assert.match(privateExport.privateKeyPem, /^-----BEGIN PRIVATE KEY-----/);
}

// Verifies wallet uniqueness by comparing independently generated public keys and addresses.
function assertTwoWalletsAreDifferent(): void {
  const first = createWallet("testnet");
  const second = createWallet("testnet");

  assert.notEqual(first.publicKeyPem, second.publicKeyPem);
  assert.notEqual(first.address, second.address);
}

// Verifies wallet addresses by validating a newly created wallet address against its network.
function assertCreatedWalletHasValidAddress(): void {
  const wallet = createWallet("mainnet");

  assert.equal(validateAddress(wallet.address, "mainnet"), true);
}

// Verifies wallet import by exporting a private key and importing it into the same network.
function assertExportedPrivateKeyImportsSuccessfully(): void {
  const wallet = createWallet("testnet");
  const privateExport = exportPrivateWallet(wallet);
  const importedWallet = importWallet(privateExport.privateKeyPem, "testnet");

  assert.equal(importedWallet.publicKeyPem, wallet.publicKeyPem);
  assert.equal(importedWallet.address, wallet.address);
}

// Verifies invalid key rejection by attempting to import malformed private key material.
function assertInvalidPrivateKeyIsRejected(): void {
  assert.throws(
    function importInvalidPrivateKey(): void {
      importWallet("not-a-private-key", "testnet");
    },
    /invalid private key/
  );
}

// Verifies public export privacy by checking exported public fields do not include private key material.
function assertPublicExportContainsNoPrivateKey(): void {
  const wallet = createWallet("local");
  const publicExport = exportPublicWallet(wallet);

  assert.equal(Object.hasOwn(publicExport, "privateKeyPem"), false);
  assert.equal(JSON.stringify(publicExport).includes("PRIVATE KEY"), false);
}

// Verifies wallet handle privacy by checking ordinary wallet fields do not include private key material.
function assertWalletHandleDoesNotExposePrivateKey(): void {
  const wallet = createWallet("local");

  assert.equal(Object.hasOwn(wallet, "privateKeyPem"), false);
  assert.equal(JSON.stringify(wallet).includes("PRIVATE KEY"), false);
}

// Verifies Phase 2 scope by checking wallets do not expose blockchain balance fields.
function assertWalletDoesNotContainBalance(): void {
  const wallet = createWallet("local");
  const publicExport = exportPublicWallet(wallet);

  assert.equal(Object.hasOwn(wallet, "balance"), false);
  assert.equal(Object.hasOwn(publicExport, "balance"), false);
}

// Verifies sensitive export labeling by checking private exports are explicit and marked sensitive.
function assertPrivateExportIsMarkedSensitive(): void {
  const wallet = createWallet("local");
  const privateExport = exportPrivateWallet(wallet);

  assert.equal(privateExport.sensitive, true);
  assert.match(privateExport.privateKeyPem, /^-----BEGIN PRIVATE KEY-----/);
}

test("wallet generates successfully", assertWalletGeneratesSuccessfully);
test("two wallets are different", assertTwoWalletsAreDifferent);
test("created wallet has valid address", assertCreatedWalletHasValidAddress);
test("exported private key imports successfully", assertExportedPrivateKeyImportsSuccessfully);
test("invalid private key is rejected", assertInvalidPrivateKeyIsRejected);
test("public export contains no private key", assertPublicExportContainsNoPrivateKey);
test("wallet handle does not expose private key", assertWalletHandleDoesNotExposePrivateKey);
test("wallet does not contain balance", assertWalletDoesNotContainBalance);
test("private export is marked sensitive", assertPrivateExportIsMarkedSensitive);
