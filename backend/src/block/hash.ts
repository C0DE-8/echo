import { hash } from "../crypto/index.js";
import type { BlockHeaderV1 } from "./block.js";
import { serializeBlockHeader } from "./serialization.js";

// Computes a deterministic block ID by SHA-256 hashing the canonical serialized block header bytes.
export function getBlockId(header: BlockHeaderV1): string {
  return hash(serializeBlockHeader(header));
}
