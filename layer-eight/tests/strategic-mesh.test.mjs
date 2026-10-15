import assert from "node:assert/strict";
import test from "node:test";
import {
  addStrategicEdge,
  addStrategicNode,
  createStrategicGraph,
  nodesByEpistemicClass,
  provenanceClosure,
  strategicEventError,
} from "../lib/strategic-mesh.ts";

const baseEvent = {
  eventId: "evt_observed_1",
  eventType: "NODE_HEALTH_OBSERVED",
  occurredAt: "2026-10-16T00:00:00.000Z",
  observedAt: "2026-10-16T00:00:01.000Z",
  source: { sourceId: "synthetic-node-a", sourceKind: "system" },
  subjectRefs: ["service:layer-eight"],
  epistemicClass: "OBSERVED",
  confidence: 0.98,
  provenanceRefs: [],
  authority: "none",
  payload: { status: "healthy" },
};

const node = (nodeId, overrides = {}) => ({
  ...baseEvent,
  nodeId,
  eventId: `evt_${nodeId}`,
  kind: "observation",
  validFrom: baseEvent.occurredAt,
  validTo: null,
  ...overrides,
});

test("observations can enter the graph without manufactured upstream provenance", () => {
  assert.equal(strategicEventError(baseEvent), null);
});

test("derived epistemic classes require provenance", () => {
  assert.match(
    strategicEventError({ ...baseEvent, epistemicClass: "INFERRED" }),
    /require provenance/,
  );
  assert.match(
    strategicEventError({ ...baseEvent, epistemicClass: "PREDICTED" }),
    /require provenance/,
  );
  assert.equal(
    strategicEventError({
      ...baseEvent,
      epistemicClass: "PREDICTED",
      provenanceRefs: ["evt_observed_1"],
    }),
    null,
  );
});

test("authorization and execution require approved authority", () => {
  assert.match(
    strategicEventError({
      ...baseEvent,
      epistemicClass: "AUTHORIZED",
      provenanceRefs: ["proposal:1"],
      authority: "operator_required",
    }),
    /approved authority/,
  );
  assert.match(
    strategicEventError({
      ...baseEvent,
      epistemicClass: "EXECUTED",
      provenanceRefs: ["approval:1"],
      authority: "advisory",
    }),
    /approved authority/,
  );
});

test("confidence stays bounded and nullable", () => {
  assert.match(strategicEventError({ ...baseEvent, confidence: 1.01 }), /between 0 and 1/);
  assert.equal(strategicEventError({ ...baseEvent, confidence: null }), null);
});

test("graph rejects duplicate nodes and dangling edges", () => {
  const graph = createStrategicGraph();
  addStrategicNode(graph, node("obs-a"));
  assert.throws(() => addStrategicNode(graph, node("obs-a")), /duplicate nodeId/);
  assert.throws(
    () =>
      addStrategicEdge(graph, {
        edgeId: "edge-bad",
        from: "obs-a",
        to: "missing",
        kind: "supports",
        createdAt: "2026-10-16T00:01:00.000Z",
        provenanceRefs: [],
      }),
    /existing nodes/,
  );
});

test("epistemic classes remain queryable instead of being flattened", () => {
  const graph = createStrategicGraph();
  addStrategicNode(graph, node("observed"));
  addStrategicNode(
    graph,
    node("predicted", {
      kind: "prediction",
      epistemicClass: "PREDICTED",
      provenanceRefs: ["evt_observed"],
      payload: { status: "possible" },
    }),
  );
  assert.equal(nodesByEpistemicClass(graph, "OBSERVED").length, 1);
  assert.equal(nodesByEpistemicClass(graph, "PREDICTED").length, 1);
});

test("provenance closure walks only explicit derived-from edges", () => {
  const graph = createStrategicGraph();
  addStrategicNode(graph, node("obs"));
  addStrategicNode(
    graph,
    node("inference", {
      kind: "inference",
      epistemicClass: "INFERRED",
      provenanceRefs: ["evt_obs"],
    }),
  );
  addStrategicNode(
    graph,
    node("prediction", {
      kind: "prediction",
      epistemicClass: "PREDICTED",
      provenanceRefs: ["evt_inference"],
    }),
  );
  addStrategicEdge(graph, {
    edgeId: "edge-inference-observation",
    from: "inference",
    to: "obs",
    kind: "derived_from",
    createdAt: "2026-10-16T00:02:00.000Z",
    provenanceRefs: ["evt_obs"],
  });
  addStrategicEdge(graph, {
    edgeId: "edge-prediction-inference",
    from: "prediction",
    to: "inference",
    kind: "derived_from",
    createdAt: "2026-10-16T00:03:00.000Z",
    provenanceRefs: ["evt_inference"],
  });
  assert.deepEqual(new Set(provenanceClosure(graph, "prediction")), new Set(["inference", "obs"]));
});
