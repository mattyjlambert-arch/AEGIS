import assert from "node:assert/strict";
import test from "node:test";
import { buildContinuityReasoningTimeline } from "../lib/continuity-reasoning.ts";

const snapshot = (id, at, state, classification = "observed") => ({
  snapshot_id: id,
  context_id: "l8_test",
  captured_at: at,
  classification,
  evidence_id: `ev_${id}`,
  state,
});

test("continuity reasoning history separates observation, revision, conflict, correction and inference", () => {
  const snapshots = [
    snapshot(
      "s1",
      "2026-10-14T00:00:00.000Z",
      {
        source_kind: "device",
        source_id: "surface",
        context_count: 12,
        external_entitlement: "active",
        internal_entitlement: "active",
        confidence: 0.9,
      },
      "last_known_good",
    ),
    snapshot(
      "s2",
      "2026-10-14T00:05:00.000Z",
      {
        source_kind: "system",
        source_id: "account-service",
        context_count: 0,
        external_entitlement: "active",
        internal_entitlement: "missing",
        confidence: 0.8,
      },
      "first_known_bad",
    ),
    snapshot(
      "s3",
      "2026-10-14T00:10:00.000Z",
      {
        source_kind: "system",
        source_id: "account-service",
        context_count: 12,
        external_entitlement: "active",
        internal_entitlement: "active",
        confidence: 0.95,
      },
    ),
  ];
  const events = [
    {
      event_id: "cev_1",
      context_id: "l8_test",
      event_type: "CROSS_SYSTEM_STATE_DIVERGENCE",
      severity: "high",
      detected_at: "2026-10-14T00:06:00.000Z",
      status: "open",
      confidence: 0.99,
      fingerprint: "fp",
      details: { reason: "systems disagree" },
    },
  ];

  const timeline = buildContinuityReasoningTimeline(snapshots, events);
  const kinds = new Set(timeline.map((item) => item.kind));
  for (const kind of [
    "observation",
    "revision",
    "conflict",
    "correction",
    "inference",
  ])
    assert.ok(kinds.has(kind), `missing ${kind}`);

  const inference = timeline.find((item) => item.kind === "inference");
  assert.equal(inference.source, "DuckyDB continuity detector");
  assert.equal(inference.confidence, 0.99);

  const correction = timeline.find((item) => item.kind === "correction");
  assert.equal(correction.details.external_entitlement, "active");
  assert.equal(correction.details.internal_entitlement, "active");
});

test("continuity reasoning history never invents confidence for legacy snapshots", () => {
  const timeline = buildContinuityReasoningTimeline(
    [snapshot("legacy", "2026-10-13T00:00:00.000Z", { context_count: 3 })],
    [],
  );
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].kind, "observation");
  assert.equal(timeline[0].confidence, null);
});

test("continuity reasoning preserves cross-device disagreement without choosing a winner", () => {
  const timeline = buildContinuityReasoningTimeline(
    [
      snapshot("home", "2026-10-14T01:00:00.000Z", {
        source_kind: "device",
        source_id: "home-base",
        confidence: 0.95,
        observations: {
          conversation_visible: true,
          artifact_revision: "v5.3",
        },
      }),
      snapshot("surface", "2026-10-14T01:03:00.000Z", {
        source_kind: "device",
        source_id: "surface-away",
        confidence: 0.8,
        observations: {
          conversation_visible: false,
          artifact_revision: "v5.3",
        },
      }),
    ],
    [],
  );
  const conflict = timeline.find(
    (item) =>
      item.kind === "conflict" &&
      item.id.startsWith("cross-source-conflict:"),
  );
  assert.ok(conflict);
  assert.match(conflict.label, /conversation_visible/);
  assert.equal(conflict.confidence, 0.8);
  assert.equal(conflict.details.resolution, "unresolved");
  assert.deepEqual(conflict.details.differences.conversation_visible, {
    "device:home-base": true,
    "device:surface-away": false,
  });
  assert.ok(!String(conflict.label).includes("true source"));
});

test("cross-device reasoning ignores observations outside the near-simultaneous window", () => {
  const timeline = buildContinuityReasoningTimeline(
    [
      snapshot("old", "2026-10-14T01:00:00.000Z", {
        source_kind: "device",
        source_id: "home-base",
        observations: { visible: true },
      }),
      snapshot("later", "2026-10-14T01:30:00.000Z", {
        source_kind: "device",
        source_id: "surface-away",
        observations: { visible: false },
      }),
    ],
    [],
  );
  assert.equal(
    timeline.some((item) => item.id.startsWith("cross-source-conflict:")),
    false,
  );
});

test("same-source observation changes become revisions without inventing absence", () => {
  const timeline = buildContinuityReasoningTimeline(
    [
      snapshot("surface-a", "2026-10-15T03:16:00.000Z", {
        source_kind: "device",
        source_id: "surface-away",
        confidence: 1,
        observations: {
          home_base_tailnet_reachable: false,
          layer_eight_healthy: true,
          old_only: "present",
        },
      }),
      snapshot("surface-b", "2026-10-15T03:18:00.000Z", {
        source_kind: "device",
        source_id: "surface-away",
        confidence: 1,
        observations: {
          home_base_tailnet_reachable: true,
          layer_eight_healthy: true,
          new_only: "present",
        },
      }),
    ],
    [],
  );
  const revision = timeline.find(
    (item) =>
      item.kind === "revision" &&
      item.details.comparison === "same-source-explicit-observation-revision",
  );
  assert.ok(revision);
  assert.equal(revision.source, "device:surface-away");
  assert.deepEqual(revision.details.changes, {
    home_base_tailnet_reachable: { from: false, to: true },
  });
  assert.equal(Object.hasOwn(revision.details.changes, "old_only"), false);
  assert.equal(Object.hasOwn(revision.details.changes, "new_only"), false);
});

test("repeated cross-source comparisons coalesce into one reviewable conflict episode", () => {
  const timeline = buildContinuityReasoningTimeline(
    [
      snapshot("home-a", "2026-10-15T03:38:32.532Z", {
        source_kind: "device",
        source_id: "home-base",
        confidence: 1,
        observations: { layer_eight_endpoint_reachable: true },
      }),
      snapshot("home-b", "2026-10-15T03:45:02.327Z", {
        source_kind: "device",
        source_id: "home-base",
        confidence: 1,
        observations: { layer_eight_endpoint_reachable: true },
      }),
      snapshot("surface", "2026-10-15T03:45:35.807Z", {
        source_kind: "device",
        source_id: "surface-away",
        confidence: 1,
        observations: { layer_eight_endpoint_reachable: false },
      }),
      snapshot("home-c", "2026-10-15T03:53:32.502Z", {
        source_kind: "device",
        source_id: "home-base",
        confidence: 1,
        observations: { layer_eight_endpoint_reachable: true },
      }),
    ],
    [],
  );

  const conflicts = timeline.filter(
    (item) =>
      item.kind === "conflict" &&
      item.details.comparison === "near-simultaneous-independent-sources" &&
      item.details.observation_key === "layer_eight_endpoint_reachable",
  );
  assert.equal(conflicts.length, 1);
  const conflict = conflicts[0];
  assert.equal(conflict.details.resolution, "unresolved");
  assert.equal(conflict.details.confirmation_count, 3);
  assert.equal(conflict.details.first_detected_at, "2026-10-15T03:45:35.807Z");
  assert.equal(conflict.details.last_confirmed_at, "2026-10-15T03:53:32.502Z");
  assert.equal(conflict.details.prior_snapshot_id, "home-b");
  assert.equal(conflict.details.current_snapshot_id, "surface");
  assert.deepEqual(new Set(conflict.details.snapshot_ids), new Set(["home-a", "home-b", "surface", "home-c"]));
  assert.deepEqual(conflict.details.differences.layer_eight_endpoint_reachable, {
    "device:home-base": true,
    "device:surface-away": false,
  });
});
