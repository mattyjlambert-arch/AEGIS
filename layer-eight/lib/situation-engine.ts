import type {
  StrategicEdge,
  StrategicGraph,
  StrategicNode,
} from "./strategic-mesh";

export type SituationKind =
  | "meaningful_change"
  | "stale_source"
  | "active_conflict"
  | "blocked_objective"
  | "fragile_dependency"
  | "pending_approval"
  | "unknown";

export type SituationItem = {
  id: string;
  kind: SituationKind;
  severity: "info" | "attention" | "high";
  title: string;
  confidence: number | null;
  provenanceNodeIds: string[];
  provenanceRefs: string[];
  details: Record<string, unknown>;
};

function confidenceOf(nodes: StrategicNode[]) {
  const values = nodes
    .map((node) => node.confidence)
    .filter((value): value is number => value !== null);
  return values.length ? Math.min(...values) : null;
}

function provenanceOf(nodes: StrategicNode[]) {
  return [
    ...new Set(nodes.flatMap((node) => [node.eventId, ...node.provenanceRefs])),
  ];
}

function nodeMap(graph: StrategicGraph) {
  return new Map(graph.nodes.map((node) => [node.nodeId, node]));
}

function edgeNodes(
  edge: StrategicEdge,
  nodes: Map<string, StrategicNode>,
): StrategicNode[] {
  return [nodes.get(edge.from), nodes.get(edge.to)].filter(
    (node): node is StrategicNode => Boolean(node),
  );
}

export function buildSituation(graph: StrategicGraph): SituationItem[] {
  const items: SituationItem[] = [];
  const nodes = nodeMap(graph);

  for (const node of graph.nodes) {
    const changeSummary = node.payload.change_summary;
    if (typeof changeSummary === "string" && changeSummary.trim()) {
      items.push({
        id: `change:${node.nodeId}`,
        kind: "meaningful_change",
        severity: "info",
        title: changeSummary,
        confidence: node.confidence,
        provenanceNodeIds: [node.nodeId],
        provenanceRefs: provenanceOf([node]),
        details: { epistemic_class: node.epistemicClass },
      });
    }

    if (
      node.kind === "observation" &&
      node.payload.reporting_status === "stale"
    ) {
      items.push({
        id: `stale:${node.nodeId}`,
        kind: "stale_source",
        severity: "attention",
        title: `Source is stale: ${node.source.sourceId}`,
        confidence: node.confidence,
        provenanceNodeIds: [node.nodeId],
        provenanceRefs: provenanceOf([node]),
        details: {
          source_id: node.source.sourceId,
          source_kind: node.source.sourceKind,
          last_seen_at: node.payload.last_seen_at ?? null,
        },
      });
    }

    if (
      node.kind === "action" &&
      node.epistemicClass === "PROPOSED" &&
      node.authority === "operator_required"
    ) {
      items.push({
        id: `approval:${node.nodeId}`,
        kind: "pending_approval",
        severity: "attention",
        title:
          typeof node.payload.title === "string"
            ? node.payload.title
            : "Proposed action requires operator approval",
        confidence: node.confidence,
        provenanceNodeIds: [node.nodeId],
        provenanceRefs: provenanceOf([node]),
        details: { action_node_id: node.nodeId },
      });
    }

    if (
      node.payload.status === "unknown" ||
      node.payload.insufficient_evidence === true
    ) {
      items.push({
        id: `unknown:${node.nodeId}`,
        kind: "unknown",
        severity: "attention",
        title:
          typeof node.payload.title === "string"
            ? node.payload.title
            : "State remains unknown",
        confidence: node.confidence,
        provenanceNodeIds: [node.nodeId],
        provenanceRefs: provenanceOf([node]),
        details: {
          reason: node.payload.reason ?? "insufficient evidence",
        },
      });
    }
  }

  for (const edge of graph.edges) {
    const related = edgeNodes(edge, nodes);
    if (related.length !== 2) continue;
    const [from, to] = related;

    if (edge.kind === "contradicts") {
      items.push({
        id: `conflict:${edge.edgeId}`,
        kind: "active_conflict",
        severity: "high",
        title: "Independent graph states conflict",
        confidence: confidenceOf(related),
        provenanceNodeIds: related.map((node) => node.nodeId),
        provenanceRefs: provenanceOf(related),
        details: {
          edge_id: edge.edgeId,
          from: from.nodeId,
          to: to.nodeId,
        },
      });
    }

    if (edge.kind === "blocks" && to.kind === "objective") {
      items.push({
        id: `blocked:${edge.edgeId}`,
        kind: "blocked_objective",
        severity: "high",
        title:
          typeof to.payload.title === "string"
            ? `Objective blocked: ${to.payload.title}`
            : "Objective blocked",
        confidence: confidenceOf(related),
        provenanceNodeIds: related.map((node) => node.nodeId),
        provenanceRefs: provenanceOf(related),
        details: {
          blocker_node_id: from.nodeId,
          objective_node_id: to.nodeId,
        },
      });
    }

    if (edge.kind === "depends_on" && from.kind === "objective") {
      const dependencyState = to.payload.status;
      if (
        dependencyState === "late" ||
        dependencyState === "stale" ||
        dependencyState === "degraded" ||
        dependencyState === "unknown"
      ) {
        items.push({
          id: `fragile:${edge.edgeId}`,
          kind: "fragile_dependency",
          severity: "attention",
          title: "Objective depends on a fragile or uncertain component",
          confidence: confidenceOf(related),
          provenanceNodeIds: related.map((node) => node.nodeId),
          provenanceRefs: provenanceOf(related),
          details: {
            objective_node_id: from.nodeId,
            dependency_node_id: to.nodeId,
            dependency_status: dependencyState,
          },
        });
      }
    }
  }

  const order: Record<SituationItem["severity"], number> = {
    high: 0,
    attention: 1,
    info: 2,
  };
  return items.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id),
  );
}
