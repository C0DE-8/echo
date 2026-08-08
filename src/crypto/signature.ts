import { createPrivateKey, createPublicKey, sign as nodeSign, verify as nodeVerify } from "node:crypto";
import { normalizeCryptoInput, type HashInput } from "./hash.js";

// Signs deterministic input bytes with an Ed25519 private key and returns the signature as hexadecimal.
export function sign(data: HashInput, privateKeyPem: string): string {
  try {
    return nodeSign(null, normalizeCryptoInput(data), createPrivateKey(privateKeyPem)).toString("hex");
  } catch {
    throw new Error("Unable to sign data with the provided private key.");
  }
}

// Verifies an Ed25519 signature by decoding hexadecimal signature bytes and checking them against the public key.
export function verify(data: HashInput, signatureHex: string, publicKeyPem: string): boolean {
  if (!isEvenLengthHex(signatureHex)) {
    return false;
  }

  try {
    return nodeVerify(
      null,
      normalizeCryptoInput(data),
      createPublicKey(publicKeyPem),
      Buffer.from(signatureHex, "hex")
    );
  } catch {
    return false;
  }
}

// Checks whether text is even-length hexadecimal by validating its characters and byte alignment.
function isEvenLengthHex(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}
