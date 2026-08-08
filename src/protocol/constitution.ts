import { getCurrentProtocolPhase, PROTOCOL_PHASES } from "./phases.js";

export const PROTOCOL_NAME = "ECHO";

export const PROTOCOL_KIND = "independent-blockchain";

export const NATIVE_ASSET_NAME = "ECHO";

export const UNRESOLVED_PROTOCOL_DECISIONS = [
  "wallet seed and derivation standard",
  "transaction data model",
  "block data model",
  "genesis block contents",
  "exact halving interval",
  "difficulty-adjustment algorithm",
  "state model",
  "mempool policy",
  "P2P message formats",
  "fork choice rules",
  "persistence schema",
  "RPC methods",
  "final mainnet address namespace confirmation",
  "encrypted wallet storage format",
  "TODO - PROTOCOL DECISION REQUIRED: wallet seed phrase standard",
  "TODO - PROTOCOL DECISION REQUIRED: hierarchical deterministic wallet derivation"
] as const;

export type ProtocolConstitution = {
  readonly protocolName: typeof PROTOCOL_NAME;
  readonly protocolKind: typeof PROTOCOL_KIND;
  readonly nativeAssetName: typeof NATIVE_ASSET_NAME;
  readonly currentPhase: ReturnType<typeof getCurrentProtocolPhase>;
  readonly phaseCount: number;
  readonly unresolvedProtocolDecisions: readonly string[];
};

// Creates a read-only Phase 0 protocol summary by collecting fixed metadata and unresolved decisions.
export function getProtocolConstitution(): ProtocolConstitution {
  return Object.freeze({
    protocolName: PROTOCOL_NAME,
    protocolKind: PROTOCOL_KIND,
    nativeAssetName: NATIVE_ASSET_NAME,
    currentPhase: getCurrentProtocolPhase(),
    phaseCount: PROTOCOL_PHASES.length,
    unresolvedProtocolDecisions: UNRESOLVED_PROTOCOL_DECISIONS
  });
}

// Checks whether a protocol decision is still unresolved by matching the exact decision label.
export function isProtocolDecisionUnresolved(decision: string): boolean {
  return UNRESOLVED_PROTOCOL_DECISIONS.includes(
    decision as (typeof UNRESOLVED_PROTOCOL_DECISIONS)[number]
  );
}
