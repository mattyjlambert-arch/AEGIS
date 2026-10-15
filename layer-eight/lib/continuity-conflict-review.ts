import type { ContinuityReasoningItem } from "./continuity-reasoning";
import type { ContinuitySnapshot } from "./continuity-core";

export type ContinuityConflictResolution =
  | "unresolved"
  | "prior_supported"
  | "current_supported"
  | "both_contextual"
  | "insufficient_evidence";

export type ContinuityConflictReview = {
  conflictId: string;
  contextId: string;
  priorSnapshotId: string;
  currentSnapshotId: string;
  resolution: ContinuityConflictResolution;
  evidenceIds: string[];
  note: string;
  version: number;
  actor: string;
  createdAt: string;
  updatedAt: string;
};

export type ConflictReviewInput = {
  resolution: ContinuityConflictResolution;
  evidenceIds: string[];
};

export function crossSourceConflictCandidate(
  timeline: ContinuityReasoningItem[],
  conflictId: string,
) {
  return timeline.find(
    (item) =>
      item.id === conflictId &&
      item.kind === "conflict" &&
      item.details.comparison === "near-simultaneous-independent-sources",
  );
}

export function conflictSnapshotIds(candidate: ContinuityReasoningItem) {
  const prior = candidate.details.prior_snapshot_id;
  const current = candidate.details.current_snapshot_id;
  return {
    priorSnapshotId: typeof prior === "string" ? prior : null,
    currentSnapshotId: typeof current === "string" ? current : null,
  };
}

export function conflictReviewError(
  candidate: ContinuityReasoningItem | undefined,
  snapshots: ContinuitySnapshot[],
  input: ConflictReviewInput,
): string | null {
  if (!candidate)
    return "Conflict candidate is not present in this continuity context";

  const { priorSnapshotId, currentSnapshotId } = conflictSnapshotIds(candidate);
  if (!priorSnapshotId || !currentSnapshotId)
    return "Conflict candidate does not identify both source snapshots";

  const pair = snapshots.filter(
    (snapshot) =>
      snapshot.snapshot_id === priorSnapshotId ||
      snapshot.snapshot_id === currentSnapshotId,
  );
  if (pair.length !== 2)
    return "Conflict source snapshots are not both present in this continuity context";

  const scopedEvidence = new Set(
    snapshots
      .map((snapshot) => snapshot.evidence_id)
      .filter((id): id is string => Boolean(id)),
  );
  if (input.evidenceIds.some((id) => !scopedEvidence.has(id)))
    return "Conflict review evidence must come from this continuity context";

  const supportDecision = [
    "prior_supported",
    "current_supported",
    "both_contextual",
  ].includes(input.resolution);
  if (supportDecision && !input.evidenceIds.length)
    return "A supported conflict resolution requires continuity evidence";

  return null;
}
