import { hash } from "../crypto/index.js";
import { getTransactionId, type SignedTransaction } from "../transaction/index.js";

export const EMPTY_TRANSACTION_ROOT = hash("ECHO_EMPTY_TX_ROOT");

// Calculates the ECHO transaction root by building a SHA-256 Merkle tree over ordered transaction IDs.
export function calculateTransactionRoot(transactions: readonly SignedTransaction[]): string {
  if (transactions.length === 0) {
    return EMPTY_TRANSACTION_ROOT;
  }

  let level = transactions.map((transaction) => hash(Buffer.from(getTransactionId(transaction), "hex")));

  while (level.length > 1) {
    level = calculateNextMerkleLevel(level);
  }

  return level[0]!;
}

// Calculates one Merkle tree level by hashing paired child bytes and duplicating the odd final hash.
function calculateNextMerkleLevel(level: readonly string[]): string[] {
  const nextLevel: string[] = [];

  for (let index = 0; index < level.length; index += 2) {
    const left = level[index]!;
    const right = level[index + 1] ?? left;
    nextLevel.push(hash(Buffer.concat([Buffer.from(left, "hex"), Buffer.from(right, "hex")])));
  }

  return nextLevel;
}
