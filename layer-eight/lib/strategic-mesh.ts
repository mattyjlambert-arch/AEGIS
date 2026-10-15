export type EpistemicClass =
  | "OBSERVED"
  | "CLAIMED"
  | "INFERRED"
  | "PREDICTED"
  | "PROPOSED"
  | "AUTHORIZED"
  | "EXECUTED"
  | "VERIFIED";

export type StrategicNodeKind =
  | "entity"
  | "observation"
  | "claim"
  | "inference"
  | "prediction"
  | "objective"
  | "risk"
  | "action"
  | "outcome";

export type StrategicEdgeKind =
  | "relates_to"
  | "supports"
  | "contradicts"
  | "supersedes"
  | "depends_on"
  | "blocks"
  | "derived_from"
  | "authorizes"
  | "produces";

export type AuthorityState =
  | "none"
  | "advisory"
  | "operator_required"
  | "approved";

export type StrategicSource = {
  sourceId: string;
  sourceKind: "device" | "system" | "connector" | "human" | "model";
};

export type StrategicEventEnvelope = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  observedAt: string;
  source: StrategicSource;
  subjectRefs: string[];
  epistemicClass: EpistemicClass;
  confidence: number | null;
  provenanceRefs: string[];
  authority: AuthorityState;
  payload: Record<string, unknown>;
};

export type StrategicNode = StrategicEventEnvelope & {
  nodeId: string;
  kind: StrategicNodeKind;
  validFrom: string;
  validTo: string | null;
};

export type StrategicEdge = {
  edgeId: string;
  from: string;
  to: string;
  kind: StrategicEdgeKind;
  createdAt: string;
  provenanceRefs: string[];
};

export type StrategicGraph = {
  nodes: StrategicNode[];
  edges: StrategicEdge[];
};

const epistemicClasses = new Set<EpistemicClass>([
  "OBSERVED",
  "CLAIMED",
  "INFERRED",
  "PREDICTED",
  "PROPOSED",
  "AUTHORIZED",
  "EXECUTED",
  "VERIFIED",
]);

const derivedClasses = new Set<EpistemicClass>([
  "INFERRED",
  "PREDICTED",
  "PROPOSED",
  "AUTHORIZED",
  "EXECUTED",
  "VERIFIED",
]);

function isIsoDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function strategicEventError(event: StrategicEventEnvelope): string | null {
  if (!event.eventId.trim()) return "eventId is required";
  if (!event.eventType.trim()) return "eventType is required";
  if (!isIsoDate(event.occurredAt) || !isIsoDate(event.observedAt))
    return "occurredAt and observedAt must be valid dates";
  if (!event.source.sourceId.trim()) return "sourceId is required";
  if (!epistemicClasses.has(event.epistemicClass))
    return "epistemicClass is invalid";
  if (
    event.confidence !== null &&
    (typeof event.confidence !== "number" ||
      !Number.isFinite(event.confidence) ||
      event.confidence < 0 ||
      event.confidence > 1)
  )
    return "confidence must be null or between 0 and 1";
  if (derivedClasses.has(event.epistemicClass) && !event.provenanceRefs.length)
    return `${event.epistemicClass} records require provenance`;
  if (event.epistemicClass === "AUTHORIZED" && event.authority !== "approved")
    return "AUTHORIZED records require approved authority";
  if (event.epistemicClass === "EXECUTED" && event.authority !== "approved")
    return "EXECUTED records require approved authority";
  return null;
}

export function createStrategicGraph(): StrategicGraph {
  return { nodes: [], edges: [] };
}

export function addStrategicNode(graph: StrategicGraph, node: StrategicNode) {
  const eventError = strategicEventError(node);
  if (eventError) throw new Error(eventError);
  if (!node.nodeId.trim()) throw new Error("nodeId is required");
  if (!isIsoDate(node.validFrom)) throw new Error("validFrom must be a valid date");
  if (node.validTo !== null && !isIsoDate(node.validTo))
    throw new Error("validTo must be null or a valid date");
  if (graph.nodes.some((existing) => existing.nodeId === node.nodeId))
    throw new Error(`duplicate nodeId: ${node.nodeId}`);
  graph.nodes.push(structuredClone(node));
  return graph;
}

export function addStrategicEdge(graph: StrategicGraph, edge: StrategicEdge) {
  if (graph.edges.some((existing) => existing.edgeId === edge.edgeId))
    throw new Error(`duplicate edgeId: ${edge.edgeId}`);
  const nodeIds = new Set(graph.nodes.map((node) => node.nodeId));
  if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to))
    throw new Error("strategic edges must reference existing nodes");
  if (!isIsoDate(edge.createdAt)) throw new Error("createdAt must be a valid date");
  graph.edges.push(structuredClone(edge));
  return graph;
}

export function nodesByEpistemicClass(
  graph: StrategicGraph,
  epistemicClass: EpistemicClass,
) {
  return graph.nodes.filter((node) => node.epistemicClass === epistemicClass);
}

export function provenanceClosure(graph: StrategicGraph, nodeId: string): string[] {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.from !== current || edge.kind !== "derived_from") continue;
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      queue.push(edge.to);
    }
  }
  return [...visited];
}
