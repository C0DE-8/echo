import { generateKeyPairSync } from "node:crypto";

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
