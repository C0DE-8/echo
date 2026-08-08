import { createHash } from "node:crypto";

export type HashInput = string | Buffer | Uint8Array;

// Converts supported cryptographic input into bytes by encoding strings as UTF-8 and copying binary data.
export function normalizeCryptoInput(data: HashInput): Buffer {
  if (typeof data === "string") {
    return Buffer.from(data, "utf8");
  }

  return Buffer.from(data);
}

// Computes a deterministic SHA-256 digest by hashing normalized input bytes and returning lowercase hexadecimal.
export function hash(data: HashInput): string {
  return createHash("sha256").update(normalizeCryptoInput(data)).digest("hex");
}
