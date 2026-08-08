import {
  derivePublicKeyFromPrivateKey,
  generateKeyPair,
  isValidPrivateKey
} from "../crypto/index.js";
import { deriveAddress } from "./address.js";
import type { EchoNetworkName } from "./network.js";

export const WALLET_VERSION = 1;

export type WalletHandle = {
  readonly kind: "echo-wallet";
  readonly version: typeof WALLET_VERSION;
  readonly network: EchoNetworkName;
  readonly publicKeyPem: string;
  readonly address: string;
};

export type PublicWalletExport = {
  readonly version: typeof WALLET_VERSION;
  readonly network: EchoNetworkName;
  readonly publicKeyPem: string;
  readonly address: string;
};

export type PrivateWalletExport = PublicWalletExport & {
  readonly sensitive: true;
  readonly privateKeyPem: string;
};

const PRIVATE_KEYS = new WeakMap<WalletHandle, string>();

// Creates an ECHO wallet by generating Ed25519 keys, deriving its address, and storing private key material internally.
export function createWallet(networkName: EchoNetworkName): WalletHandle {
  const keyPair = generateKeyPair();

  return createWalletHandle(networkName, keyPair.publicKeyPem, keyPair.privateKeyPem);
}

// Imports an ECHO wallet by validating a private key, deriving its public key, and rebuilding its address.
export function importWallet(privateKeyPem: string, networkName: EchoNetworkName): WalletHandle {
  if (!isValidPrivateKey(privateKeyPem)) {
    throw new Error("Unable to import invalid private key.");
  }

  return createWalletHandle(networkName, derivePublicKeyFromPrivateKey(privateKeyPem), privateKeyPem);
}

// Exports public wallet information by copying address identity fields without private key material.
export function exportPublicWallet(wallet: WalletHandle): PublicWalletExport {
  return Object.freeze({
    version: wallet.version,
    network: wallet.network,
    publicKeyPem: wallet.publicKeyPem,
    address: wallet.address
  });
}

// Exports sensitive wallet information by explicitly attaching the internally stored private key to public fields.
export function exportPrivateWallet(wallet: WalletHandle): PrivateWalletExport {
  const privateKeyPem = PRIVATE_KEYS.get(wallet);

  if (privateKeyPem === undefined) {
    throw new Error("Unable to export private wallet material.");
  }

  return Object.freeze({
    ...exportPublicWallet(wallet),
    sensitive: true,
    privateKeyPem
  });
}

// Creates a wallet handle by freezing public fields and linking private key material through a WeakMap.
function createWalletHandle(networkName: EchoNetworkName, publicKeyPem: string, privateKeyPem: string): WalletHandle {
  const wallet = Object.freeze({
    kind: "echo-wallet" as const,
    version: WALLET_VERSION,
    network: networkName,
    publicKeyPem,
    address: deriveAddress(publicKeyPem, networkName)
  });

  PRIVATE_KEYS.set(wallet, privateKeyPem);

  return wallet;
}
