import { createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";

export const SIGNATURE_ALGORITHM = "Ed25519";

export type EchoKeyPair = {
  readonly algorithm: typeof SIGNATURE_ALGORITHM;
  readonly publicKeyPem: string;
  readonly privateKeyPem: string;
};

// Generates a cryptographically secure Ed25519 key pair using Node.js standard crypto APIs and PEM export.
export function generateKeyPair(): EchoKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }) as string;
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

  return Object.freeze({
    algorithm: SIGNATURE_ALGORITHM,
    publicKeyPem,
    privateKeyPem
  });
}

// Derives an Ed25519 public key PEM by parsing a PKCS#8 private key and exporting its matching SPKI public key.
export function derivePublicKeyFromPrivateKey(privateKeyPem: string): string {
  const privateKey = createPrivateKey(privateKeyPem);

  if (privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error("Unsupported private key algorithm.");
  }

  return createPublicKey(privateKey).export({ type: "spki", format: "pem" }) as string;
}

// Validates an Ed25519 public key PEM by parsing it with Node.js crypto and checking its algorithm identifier.
export function isValidPublicKey(publicKeyPem: string): boolean {
  try {
    return createPublicKey(publicKeyPem).asymmetricKeyType === "ed25519";
  } catch {
    return false;
  }
}

// Validates an Ed25519 private key PEM by parsing it with Node.js crypto and checking its algorithm identifier.
export function isValidPrivateKey(privateKeyPem: string): boolean {
  try {
    return createPrivateKey(privateKeyPem).asymmetricKeyType === "ed25519";
  } catch {
    return false;
  }
}
