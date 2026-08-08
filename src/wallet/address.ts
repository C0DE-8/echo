import { createHash } from "node:crypto";
import { isValidPublicKey } from "../crypto/index.js";
import { getNetwork, getNetworkByHumanReadablePart, type EchoNetworkName } from "./network.js";

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const ADDRESS_PAYLOAD_BYTE_LENGTH = 20;

export type DecodedAddress = {
  readonly network: EchoNetworkName;
  readonly version: number;
  readonly payloadHex: string;
};

// Derives a checksummed ECHO address by hashing an Ed25519 public key and Bech32-encoding network/version data.
export function deriveAddress(publicKeyPem: string, networkName: EchoNetworkName): string {
  if (!isValidPublicKey(publicKeyPem)) {
    throw new Error("Unable to derive address from invalid public key.");
  }

  const network = getNetwork(networkName);
  const payload = hashPublicKeyForAddress(publicKeyPem);
  const data = [network.addressVersion, ...convertBits([...payload], 8, 5, true)];

  return bech32Encode(network.humanReadablePart, data);
}

// Validates an ECHO address by decoding Bech32 and checking network, version, payload length, and checksum.
export function validateAddress(address: string, expectedNetworkName?: EchoNetworkName): boolean {
  return decodeAddress(address, expectedNetworkName) !== undefined;
}

// Decodes an ECHO address by validating Bech32 data and returning its network, version, and payload.
export function decodeAddress(address: string, expectedNetworkName?: EchoNetworkName): DecodedAddress | undefined {
  const decoded = bech32Decode(address);

  if (decoded === undefined || decoded.data.length < 2) {
    return undefined;
  }

  const network = getNetworkByHumanReadablePart(decoded.humanReadablePart);

  if (network === undefined || expectedNetworkName !== undefined && network.name !== expectedNetworkName) {
    return undefined;
  }

  const version = decoded.data[0];
  const payload = convertBits(decoded.data.slice(1), 5, 8, false);

  if (version !== network.addressVersion || payload.length !== ADDRESS_PAYLOAD_BYTE_LENGTH) {
    return undefined;
  }

  return Object.freeze({
    network: network.name,
    version,
    payloadHex: Buffer.from(payload).toString("hex")
  });
}

// Hashes a public key for address payload use by applying SHA-256 and then RIPEMD-160 to UTF-8 PEM bytes.
function hashPublicKeyForAddress(publicKeyPem: string): Buffer {
  const sha256Digest = createHash("sha256").update(publicKeyPem, "utf8").digest();

  return createHash("ripemd160").update(sha256Digest).digest();
}

// Encodes Bech32 data by appending its checksum and mapping five-bit values to the standard charset.
function bech32Encode(humanReadablePart: string, data: readonly number[]): string {
  const normalizedPart = humanReadablePart.toLowerCase();
  const checksum = createBech32Checksum(normalizedPart, data);
  let encoded = `${normalizedPart}1`;

  for (const value of [...data, ...checksum]) {
    encoded += BECH32_CHARSET[value];
  }

  return encoded;
}

// Decodes Bech32 text by validating case, separator, charset, and checksum before returning data values.
function bech32Decode(address: string): { readonly humanReadablePart: string; readonly data: readonly number[] } | undefined {
  if (address.length === 0 || address !== address.toLowerCase() && address !== address.toUpperCase()) {
    return undefined;
  }

  const normalizedAddress = address.toLowerCase();
  const separatorIndex = normalizedAddress.lastIndexOf("1");

  if (separatorIndex < 1 || separatorIndex + 7 > normalizedAddress.length) {
    return undefined;
  }

  const humanReadablePart = normalizedAddress.slice(0, separatorIndex);
  const data: number[] = [];

  for (const character of normalizedAddress.slice(separatorIndex + 1)) {
    const value = BECH32_CHARSET.indexOf(character);

    if (value === -1) {
      return undefined;
    }

    data.push(value);
  }

  if (!verifyBech32Checksum(humanReadablePart, data)) {
    return undefined;
  }

  return Object.freeze({ humanReadablePart, data: data.slice(0, -6) });
}

// Creates a Bech32 checksum by expanding the HRP, calculating polymod, and extracting six five-bit values.
function createBech32Checksum(humanReadablePart: string, data: readonly number[]): number[] {
  const values = [...expandBech32HumanReadablePart(humanReadablePart), ...data, 0, 0, 0, 0, 0, 0];
  const polymod = calculateBech32Polymod(values) ^ 1;
  const checksum: number[] = [];

  for (let index = 0; index < 6; index += 1) {
    checksum.push(polymod >> 5 * (5 - index) & 31);
  }

  return checksum;
}

// Verifies a Bech32 checksum by checking whether the expanded HRP and data polymod equals one.
function verifyBech32Checksum(humanReadablePart: string, data: readonly number[]): boolean {
  return calculateBech32Polymod([...expandBech32HumanReadablePart(humanReadablePart), ...data]) === 1;
}

// Expands a Bech32 HRP by splitting each character into high bits, a separator zero, and low bits.
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

// Calculates the Bech32 polymod checksum core by applying the standard generator constants to each value.
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

// Converts integer groups between bit widths by accumulating bits and optionally padding the final group.
function convertBits(values: readonly number[], fromBits: number, toBits: number, pad: boolean): number[] {
  let accumulator = 0;
  let bitCount = 0;
  const converted: number[] = [];
  const maxOutputValue = (1 << toBits) - 1;
  const maxInputValue = (1 << fromBits) - 1;

  for (const value of values) {
    if (value < 0 || value >> fromBits !== 0) {
      throw new Error("Invalid value for bit conversion.");
    }

    accumulator = accumulator << fromBits | value;
    bitCount += fromBits;

    while (bitCount >= toBits) {
      bitCount -= toBits;
      converted.push(accumulator >> bitCount & maxOutputValue);
    }
  }

  if (pad && bitCount > 0) {
    converted.push(accumulator << toBits - bitCount & maxOutputValue);
  }

  if (!pad && (bitCount >= fromBits || (accumulator << toBits - bitCount & maxOutputValue) !== 0)) {
    throw new Error("Invalid padding in bit conversion.");
  }

  return converted;
}
