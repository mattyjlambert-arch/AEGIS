import assert from "node:assert/strict";
import test from "node:test";
import {
  addStrategicEdge,
  addStrategicNode,
  createStrategicGraph,
} from "../lib/strategic-mesh.ts";
import { buildSituation } from "../lib/situation-engine.ts";

const observed = (nodeId, payload = {}, overrides = {}) => ({
  nodeId,
  eventId: `evt_${nodeId}`,
  eventType: "SYNTHETIC_EVENT",
  occurredAt: "2026-10-16T00:00:00.000Z",
  observedAt: "2026-10-16T00:00:01.000Z",
  source: { sourceId: `source-${nodeId}`, sourceKind: "system" },
  subjectRefs: [nodeId],
  epistemicClass: "OBSERVED",
  confidence: 1,
  provenanceRefs: [],
  authority: "none",
  payload,
  kind: "observation",
  validFrom: "2026-10-16T00:00:00.000Z",
  validTo: null,
  ...overrides,
});

function edge(edgeId, from, to, kind) {
  return {
    edgeId,
    from,
    to,
    kind,
    createdAt: "2026-10-16T00:05:00.000Z",
    provenanceRefs: [],
  };
}

test("situation engine surfaces change, stale source, conflict, blocked objective, fragility, approval and unknown", () => {
  const graph = createStrategicGraph();
  addStrategicNode(graph, observed("change", { change_summary: "Synthetic service changed state" }));
  addStrategicNode(
    graph,
    observed("stale", {
      reporting_status: "stale",
      last_seen_at: "2026-10-15T23:30:00.000Z",
    }),
  );
  addStrategicNode(graph, observed("conflict-a", { value: true }, { confidence: 0.9 }));
  addStrategicNode(graph, observed("conflict-b", { value: false }, { confidence: 0.7 }));
  addStrategicNode(
    graph,
    observed("objective", { title: "Restore synthetic service" }, { kind: "objective" }),
  );
  addStrategicNode(graph, observed("blocker", { status: "degraded" }, { kind: "risk" }));
  addStrategicNode(graph, observed("dependency", { status: "stale" }, { kind: "entity" }));
  addStrategicNode(
    graph,
    observed(
      "proposal",
      { title: "Restart synthetic service" },
      {
        kind: "action",
        epistemicClass: "PROPOSED",
        provenanceRefs: ["evt_blocker"],
        authority: "operator_required",
        confidence: 0.8,
      },
    ),
  );
  addStrategicNode(graph, observed("unknown", { status: "unknown", reason: "source disagreement" }));

  addStrategicEdge(graph, edge("conflict-edge", "conflict-a", "conflict-b", "contradicts"));
  addStrategicEdge(graph, edge("block-edge", "blocker", "objective", "blocks"));
  addStrategicEdge(graph, edge("dependency-edge", "objective", "dependency", "depends_on"));

  const situation = buildSituation(graph);
  const kinds = new Set(situation.map((item) => item.kind));
  for (const kind of [
    "meaningful_change",
    "stale_source",
    "active_conflict",
    "blocked_objective",
    "fragile_dependency",
    "pending_approval",
    "unknown",
  ])
    assert.ok(kinds.has(kind), `missing ${kind}`);

  const conflict = situation.find((item) => item.kind === "active_conflict");
  assert.equal(conflict.confidence, 0.7);
  assert.deepEqual(new Set(conflict.provenanceNodeIds), new Set(["conflict-a", "conflict-b"]));
});

test("silence alone does not become a stale-source situation", () => {
  const graph = createStrategicGraph();
  addStrategicNode(
    graph,
    observed("quiet-source", {
      last_seen_at: "2026-01-01T00:00:00.000Z",
    }),
  );
  const situation = buildSituation(graph);
  assert.equal(situation.some((item) => item.kind === "stale_source"), false);
});

test("predictions remain predictions and do not become observations", () => {
  const graph = createStrategicGraph();
  addStrategicNode(
    graph,
    observed(
      "forecast",
      { title: "Synthetic degradation possible", status: "possible" },
      {
        kind: "prediction",
        epistemicClass: "PREDICTED",
        provenanceRefs: ["evt_seed"],
        confidence: 0.6,
      },
    ),
  );
  const situation = buildSituation(graph);
  assert.equal(situation.length, 0);
  assert.equal(graph.nodes[0].epistemicClass, "PREDICTED");
});

test("pending approval does not imply authorization or execution", () => {
  const graph = createStrategicGraph();
  addStrategicNode(
    graph,
    observed(
      "proposal",
      { title: "Synthetic repair" },
      {
        kind: "action",
        epistemicClass: "PROPOSED",
        provenanceRefs: ["evt_observation"],
        authority: "operator_required",
      },
    ),
  );
  const situation = buildSituation(graph);
  const approval = situation.find((item) => item.kind === "pending_approval");
  assert.ok(approval);
  assert.equal(graph.nodes[0].epistemicClass, "PROPOSED");
  assert.equal(graph.nodes[0].authority, "operator_required");
});

test("all derived situation items preserve graph provenance", () => {
  const graph = createStrategicGraph();
  addStrategicNode(
    graph,
    observed("unknown", {
      status: "unknown",
      reason: "synthetic source conflict",
    }, { provenanceRefs: ["evidence:synthetic-1"] }),
  );
  const item = buildSituation(graph)[0];
  assert.deepEqual(
    new Set(item.provenanceRefs),
    new Set(["evt_unknown", "evidence:synthetic-1"]),
  );
});
