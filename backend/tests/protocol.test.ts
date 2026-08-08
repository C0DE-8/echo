import assert from "node:assert/strict";
import test from "node:test";
import {
  canImplementPhase,
  getCurrentProtocolPhase,
  getProtocolConstitution,
  isProtocolDecisionUnresolved,
  PROTOCOL_PHASES,
  PROTOCOL_KIND,
  PROTOCOL_NAME
} from "../src/index.js";

// Verifies the project identity by reading the exported Phase 0 protocol metadata.
function assertEchoProjectIdentity(): void {
  const constitution = getProtocolConstitution();

  assert.equal(PROTOCOL_NAME, "ECHO");
  assert.equal(PROTOCOL_KIND, "independent-blockchain");
  assert.equal(constitution.nativeAssetName, "ECHO");
}

// Verifies phase gating by confirming only completed and current phases are implementable.
function assertCurrentPhaseGate(): void {
  assert.deepEqual(getCurrentProtocolPhase(), {
    index: 3,
    name: "Transactions",
    status: "current"
  });
  assert.equal(canImplementPhase(0), true);
  assert.equal(canImplementPhase(1), true);
  assert.equal(canImplementPhase(2), true);
  assert.equal(canImplementPhase(3), true);
  assert.equal(canImplementPhase(4), false);
}

// Verifies phase ordering by checking each phase index matches its array position.
function assertProtocolPhaseOrder(): void {
  for (let index = 0; index < PROTOCOL_PHASES.length; index += 1) {
    assert.equal(PROTOCOL_PHASES[index]?.index, index);
  }
}

// Verifies unresolved decisions remain explicit by checking representative future-phase decisions.
function assertUnresolvedProtocolDecisions(): void {
  assert.equal(isProtocolDecisionUnresolved("wallet seed and derivation standard"), true);
  assert.equal(isProtocolDecisionUnresolved("transaction data model"), true);
  assert.equal(isProtocolDecisionUnresolved("difficulty-adjustment algorithm"), true);
  assert.equal(isProtocolDecisionUnresolved("ERC-20 contract address"), false);
}

test("defines ECHO as an independent blockchain protocol", assertEchoProjectIdentity);
test("allows only the current protocol phase to be implemented", assertCurrentPhaseGate);
test("keeps protocol phases in deterministic order", assertProtocolPhaseOrder);
test("tracks unresolved protocol decisions without inventing future behavior", assertUnresolvedProtocolDecisions);
