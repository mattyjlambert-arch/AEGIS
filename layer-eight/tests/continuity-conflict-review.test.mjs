import assert from "node:assert/strict";
import test from "node:test";
import {
  conflictReviewError,
  conflictSnapshotIds,
  crossSourceConflictCandidate,
} from "../lib/continuity-conflict-review.ts";

const snapshots = [
  {
    snapshot_id: "snap_a", context_id: "ctx", captured_at: "2026-10-15T00:00:00Z",
    classification: "observed", evidence_id: "ev_a",
    state: { source_kind: "device", source_id: "a", observations: { visible: true } },
  },
  {
    snapshot_id: "snap_b", context_id: "ctx", captured_at: "2026-10-15T00:01:00Z",
    classification: "observed", evidence_id: "ev_b",
    state: { source_kind: "device", source_id: "b", observations: { visible: false } },
  },
];
const candidate = {
  id: "cross-source-conflict:snap_a:snap_b",
  at: "2026-10-15T00:01:00Z",
  kind: "conflict",
  label: "Independent sources disagree: visible",
  confidence: 1,
  source: "device:a ↔ device:b",
  details: {
    comparison: "near-simultaneous-independent-sources",
    prior_snapshot_id: "snap_a",
    current_snapshot_id: "snap_b",
    resolution: "unresolved",
  },
};

test("conflict candidate lookup accepts only cross-source conflicts", () => {
  assert.equal(crossSourceConflictCandidate([candidate], candidate.id)?.id, candidate.id);
  assert.equal(crossSourceConflictCandidate([{ ...candidate, details: { comparison: "other" } }], candidate.id), undefined);
});

test("conflict snapshot IDs come from the server-derived candidate", () => {
  assert.deepEqual(conflictSnapshotIds(candidate), {
    priorSnapshotId: "snap_a",
    currentSnapshotId: "snap_b",
  });
});

test("supported conflict outcomes require scoped evidence", () => {
  assert.match(conflictReviewError(candidate, snapshots, { resolution: "prior_supported", evidenceIds: [] }), /requires continuity evidence/i);
  assert.match(conflictReviewError(candidate, snapshots, { resolution: "current_supported", evidenceIds: ["ev_foreign"] }), /this continuity context/i);
  assert.equal(conflictReviewError(candidate, snapshots, { resolution: "both_contextual", evidenceIds: ["ev_a", "ev_b"] }), null);
});

test("insufficient evidence and unresolved remain valid without manufacturing proof", () => {
  assert.equal(conflictReviewError(candidate, snapshots, { resolution: "insufficient_evidence", evidenceIds: [] }), null);
  assert.equal(conflictReviewError(candidate, snapshots, { resolution: "unresolved", evidenceIds: [] }), null);
});

test("review refuses conflict IDs or source snapshots outside the scoped context", () => {
  assert.match(conflictReviewError(undefined, snapshots, { resolution: "unresolved", evidenceIds: [] }), /not present/i);
  assert.match(conflictReviewError(candidate, [snapshots[0]], { resolution: "insufficient_evidence", evidenceIds: [] }), /both present/i);
});
