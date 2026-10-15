import type { ContinuityEvent, ContinuitySnapshot } from "./continuity-core";
import {
  addStrategicEdge,
  addStrategicNode,
  createStrategicGraph,
  type StrategicGraph,
  type StrategicSource,
} from "./strategic-mesh";

function confidenceFromSnapshot(snapshot: ContinuitySnapshot) {
  const value = snapshot.state.confidence;
  return typeof value === "number" && value >= 0 && value <= 1 ? value : null;
}

function sourceFromSnapshot(snapshot: ContinuitySnapshot): StrategicSource {
  const sourceId =
    typeof snapshot.state.source_id === "string" && snapshot.state.source_id.trim()
      ? snapshot.state.source_id
      : "duckydb-continuity";
  const rawKind = snapshot.state.source_kind;
  const sourceKind =
    rawKind === "device" || rawKind === "system" || rawKind === "connector"
      ? rawKind
      : "system";
  return { sourceId, sourceKind };
}

function snapshotNodeId(snapshotId: string) {
  return `continuity:snapshot:${snapshotId}`;
}

function eventNodeId(eventId: string) {
  return `continuity:event:${eventId}`;
}

function referencedSnapshotIds(details: Record<string, unknown>) {
  const refs = new Set<string>();
  for (const key of ["snapshot_id", "prior_snapshot_id", "current_snapshot_id"]) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) refs.add(value);
  }
  const many = details.snapshot_ids;
  if (Array.isArray(many)) {
    for (const value of many) {
      if (typeof value === "string" && value.trim()) refs.add(value);
    }
  }
  return [...refs];
}

export function continuitySnapshotStrategicNode(snapshot: ContinuitySnapshot) {
  return {
    nodeId: snapshotNodeId(snapshot.snapshot_id),
    eventId: `continuity.snapshot:${snapshot.snapshot_id}`,
    eventType: "CONTINUITY_SNAPSHOT_OBSERVED",
    occurredAt: snapshot.captured_at,
    observedAt: snapshot.captured_at,
    source: sourceFromSnapshot(snapshot),
    subjectRefs: [`continuity:${snapshot.context_id}`],
    epistemicClass: "OBSERVED" as const,
    confidence: confidenceFromSnapshot(snapshot),
    provenanceRefs: snapshot.evidence_id ? [`evidence:${snapshot.evidence_id}`] : [],
    authority: "none" as const,
    payload: {
      classification: snapshot.classification,
      state: structuredClone(snapshot.state),
    },
    kind: "observation" as const,
    validFrom: snapshot.captured_at,
    validTo: null,
  };
}

export function continuityEventStrategicNode(event: ContinuityEvent) {
  const snapshotIds = referencedSnapshotIds(event.details);
  if (!snapshotIds.length)
    throw new Error(
      `Continuity inference ${event.event_id} has no traceable snapshot provenance`,
    );
  return {
    nodeId: eventNodeId(event.event_id),
    eventId: `continuity.inference:${event.event_id}`,
    eventType: event.event_type,
    occurredAt: event.detected_at,
    observedAt: event.detected_at,
    source: { sourceId: "duckydb-continuity-detector", sourceKind: "system" as const },
    subjectRefs: [`continuity:${event.context_id}`],
    epistemicClass: "INFERRED" as const,
    confidence: event.confidence,
    provenanceRefs: snapshotIds.map((id) => snapshotNodeId(id)),
    authority: "none" as const,
    payload: {
      severity: event.severity,
      status: event.status,
      fingerprint: event.fingerprint,
      details: structuredClone(event.details),
    },
    kind: "inference" as const,
    validFrom: event.detected_at,
    validTo: null,
  };
}

export function continuityToStrategicGraph(
  snapshots: ContinuitySnapshot[],
  events: ContinuityEvent[],
): StrategicGraph {
  const graph = createStrategicGraph();
  const snapshotIds = new Set(snapshots.map((snapshot) => snapshot.snapshot_id));

  for (const snapshot of snapshots)
    addStrategicNode(graph, continuitySnapshotStrategicNode(snapshot));

  for (const event of events) {
    const referenced = referencedSnapshotIds(event.details);
    const missing = referenced.filter((id) => !snapshotIds.has(id));
    if (missing.length)
      throw new Error(
        `Continuity inference ${event.event_id} references missing snapshots: ${missing.join(", ")}`,
      );
    const node = continuityEventStrategicNode(event);
    addStrategicNode(graph, node);
    for (const snapshotId of referenced) {
      addStrategicEdge(graph, {
        edgeId: `continuity:derived:${event.event_id}:${snapshotId}`,
        from: node.nodeId,
        to: snapshotNodeId(snapshotId),
        kind: "derived_from",
        createdAt: event.detected_at,
        provenanceRefs: [node.eventId, `continuity.snapshot:${snapshotId}`],
      });
    }
  }

  return graph;
}
