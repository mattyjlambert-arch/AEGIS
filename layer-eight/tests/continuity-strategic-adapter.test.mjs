import assert from "node:assert/strict";
import test from "node:test";
import {
  continuityEventStrategicNode,
  continuitySnapshotStrategicNode,
  continuityToStrategicGraph,
} from "../lib/continuity-strategic-adapter.ts";

const snapshots = [
  {
    snapshot_id: "snap_1",
    context_id: "ctx_synthetic",
    captured_at: "2026-10-16T01:00:00.000Z",
    classification: "observed",
    evidence_id: "ev_synthetic_1",
    state: {
      source_kind: "device",
      source_id: "synthetic-node-a",
      confidence: 0.9,
      observations: { service_reachable: true },
    },
  },
  {
    snapshot_id: "snap_2",
    context_id: "ctx_synthetic",
    captured_at: "2026-10-16T01:01:00.000Z",
    classification: "observed",
    evidence_id: "ev_synthetic_2",
    state: {
      source_kind: "device",
      source_id: "synthetic-node-b",
      confidence: 0.8,
      observations: { service_reachable: false },
    },
  },
];

const inferredEvent = {
  event_id: "cev_1",
  context_id: "ctx_synthetic",
  event_type: "CROSS_SOURCE_DIVERGENCE",
  severity: "high",
  detected_at: "2026-10-16T01:01:30.000Z",
  status: "open",
  confidence: 0.8,
  fingerprint: "synthetic-fingerprint",
  details: {
    prior_snapshot_id: "snap_1",
    current_snapshot_id: "snap_2",
  },
};

test("continuity snapshots remain OBSERVED in the strategic graph", () => {
  const node = continuitySnapshotStrategicNode(snapshots[0]);
  assert.equal(node.epistemicClass, "OBSERVED");
  assert.equal(node.kind, "observation");
  assert.equal(node.confidence, 0.9);
  assert.deepEqual(node.provenanceRefs, ["evidence:ev_synthetic_1"]);
});

test("DuckyDB detector events remain INFERRED and retain snapshot provenance", () => {
  const node = continuityEventStrategicNode(inferredEvent);
  assert.equal(node.epistemicClass, "INFERRED");
  assert.equal(node.kind, "inference");
  assert.deepEqual(
    new Set(node.provenanceRefs),
    new Set(["continuity:snapshot:snap_1", "continuity:snapshot:snap_2"]),
  );
});

test("adapter creates explicit derived-from edges without copying evidence", () => {
  const graph = continuityToStrategicGraph(snapshots, [inferredEvent]);
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);
  assert.ok(graph.edges.every((edge) => edge.kind === "derived_from"));
  const observation = graph.nodes.find((node) => node.nodeId === "continuity:snapshot:snap_1");
  assert.equal(observation.payload.state.observations.service_reachable, true);
  assert.equal(Object.hasOwn(observation.payload, "evidence_body"), false);
});

test("inference with no traceable snapshot provenance fails closed", () => {
  assert.throws(
    () =>
      continuityEventStrategicNode({
        ...inferredEvent,
        event_id: "cev_unscoped",
        details: { reason: "synthetic detector result without source refs" },
      }),
    /no traceable snapshot provenance/,
  );
});

test("adapter rejects inference references to snapshots outside the supplied context", () => {
  assert.throws(
    () =>
      continuityToStrategicGraph(snapshots, [
        {
          ...inferredEvent,
          event_id: "cev_missing",
          details: { snapshot_id: "snap_missing" },
        },
      ]),
    /references missing snapshots/,
  );
});
