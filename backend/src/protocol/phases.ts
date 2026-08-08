export type ProtocolPhaseStatus = "current" | "future";

export type ProtocolPhase = {
  readonly index: number;
  readonly name: string;
  readonly status: ProtocolPhaseStatus;
};

export const PROTOCOL_PHASES = [
  { index: 0, name: "Protocol Constitution", status: "future" },
  { index: 1, name: "Cryptography", status: "future" },
  { index: 2, name: "Wallet", status: "future" },
  { index: 3, name: "Transactions", status: "current" },
  { index: 4, name: "Blockchain", status: "future" },
  { index: 5, name: "State / Ledger", status: "future" },
  { index: 6, name: "Mempool", status: "future" },
  { index: 7, name: "Consensus / Proof of Work", status: "future" },
  { index: 8, name: "P2P Network", status: "future" },
  { index: 9, name: "Node Software", status: "future" },
  { index: 10, name: "Blockchain Synchronization", status: "future" },
  { index: 11, name: "Forks and Chain Reorganization", status: "future" },
  { index: 12, name: "Persistent Storage", status: "future" },
  { index: 13, name: "RPC/API", status: "future" },
  { index: 14, name: "Local Testnet", status: "future" },
  { index: 15, name: "Public Testnet", status: "future" },
  { index: 16, name: "Blockchain Explorer", status: "future" },
  { index: 17, name: "Wallet Application", status: "future" },
  { index: 18, name: "Distribution / Airdrop", status: "future" },
  { index: 19, name: "Economics", status: "future" }
] as const satisfies readonly ProtocolPhase[];

// Returns the current protocol phase by selecting the single phase marked current.
export function getCurrentProtocolPhase(): ProtocolPhase {
  const currentPhases: ProtocolPhase[] = [];

  for (const phase of PROTOCOL_PHASES) {
    if (phase.status === "current") {
      currentPhases.push(phase);
    }
  }

  if (currentPhases.length !== 1) {
    throw new Error("Protocol phase configuration must have exactly one current phase.");
  }

  return currentPhases[0]!;
}

// Reports whether the requested phase may be implemented by comparing it with the current phase index.
export function canImplementPhase(phaseIndex: number): boolean {
  return phaseIndex <= getCurrentProtocolPhase().index;
}
