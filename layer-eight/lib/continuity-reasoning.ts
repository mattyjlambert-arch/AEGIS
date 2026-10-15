import type { ContinuityEvent, ContinuitySnapshot } from "./continuity-core";

export type ContinuityReasoningKind =
  | "observation"
  | "revision"
  | "conflict"
  | "correction"
  | "inference";

export type ContinuityReasoningItem = {
  id: string;
  at: string;
  kind: ContinuityReasoningKind;
  label: string;
  confidence: number | null;
  source: string;
  details: Record<string, unknown>;
};

const CROSS_SOURCE_WINDOW_MS = 10 * 60 * 1000;

const TRACKED_FIELDS = [
  "context_count",
  "identity_anchor_hash",
  "external_entitlement",
  "internal_entitlement",
] as const;

function confidenceOf(snapshot: ContinuitySnapshot) {
  const value = snapshot.state.confidence;
  return typeof value === "number" && value >= 0 && value <= 1
    ? value
    : null;
}

function sourceOf(snapshot: ContinuitySnapshot) {
  const kind = snapshot.state.source_kind;
  const id = snapshot.state.source_id;
  if (typeof kind === "string" && typeof id === "string")
    return `${kind}:${id}`;
  if (typeof snapshot.state.source === "string") return snapshot.state.source;
  return "continuity snapshot";
}

function entitlementConflict(snapshot: ContinuitySnapshot) {
  const external = snapshot.state.external_entitlement;
  const internal = snapshot.state.internal_entitlement;
  return (
    typeof external === "string" &&
    external.length > 0 &&
    typeof internal === "string" &&
    internal.length > 0 &&
    external.toLowerCase() !== internal.toLowerCase()
  );
}

function observationMap(snapshot: ContinuitySnapshot): Record<string, unknown> {
  const value = snapshot.state.observations;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sourceIdentity(snapshot: ContinuitySnapshot) {
  const kind = snapshot.state.source_kind;
  const id = snapshot.state.source_id;
  return typeof kind === "string" && typeof id === "string"
    ? `${kind}:${id}`
    : null;
}

function entitlementAligned(snapshot: ContinuitySnapshot) {
  const external = snapshot.state.external_entitlement;
  const internal = snapshot.state.internal_entitlement;
  return (
    typeof external === "string" &&
    external.length > 0 &&
    typeof internal === "string" &&
    internal.length > 0 &&
    external.toLowerCase() === internal.toLowerCase()
  );
}

export function buildContinuityReasoningTimeline(
  snapshots: ContinuitySnapshot[],
  events: ContinuityEvent[],
): ContinuityReasoningItem[] {
  const items: ContinuityReasoningItem[] = [];
  const ordered = [...snapshots].sort(
    (a, b) => Date.parse(a.captured_at) - Date.parse(b.captured_at),
  );
  let previous: ContinuitySnapshot | undefined;
  let previousConflict = false;

  for (const snapshot of ordered) {
    const confidence = confidenceOf(snapshot);
    const source = sourceOf(snapshot);
    items.push({
      id: `observation:${snapshot.snapshot_id}`,
      at: snapshot.captured_at,
      kind: "observation",
      label: `${snapshot.classification.replaceAll("_", " ")} observation`,
      confidence,
      source,
      details: {
        evidence_id: snapshot.evidence_id,
        ...snapshot.state,
      },
    });

    if (previous) {
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const field of TRACKED_FIELDS) {
        const before = previous.state[field];
        const after = snapshot.state[field];
        if (
          (before !== undefined || after !== undefined) &&
          JSON.stringify(before) !== JSON.stringify(after)
        )
          changes[field] = { from: before ?? null, to: after ?? null };
      }
      if (Object.keys(changes).length) {
        items.push({
          id: `revision:${previous.snapshot_id}:${snapshot.snapshot_id}`,
          at: snapshot.captured_at,
          kind: "revision",
          label: `Observed state revised: ${Object.keys(changes)
            .map((field) => field.replaceAll("_", " "))
            .join(", ")}`,
          confidence,
          source,
          details: {
            previous_snapshot_id: previous.snapshot_id,
            current_snapshot_id: snapshot.snapshot_id,
            changes,
          },
        });
      }
    }

    const conflict = entitlementConflict(snapshot);
    if (conflict) {
      items.push({
        id: `conflict:${snapshot.snapshot_id}`,
        at: snapshot.captured_at,
        kind: "conflict",
        label: "Observed entitlement states disagree",
        confidence,
        source,
        details: {
          external_entitlement: snapshot.state.external_entitlement,
          internal_entitlement: snapshot.state.internal_entitlement,
          snapshot_id: snapshot.snapshot_id,
        },
      });
    } else if (previousConflict && entitlementAligned(snapshot)) {
      items.push({
        id: `correction:${snapshot.snapshot_id}`,
        at: snapshot.captured_at,
        kind: "correction",
        label: "Later observation shows entitlement states aligned",
        confidence,
        source,
        details: {
          external_entitlement: snapshot.state.external_entitlement,
          internal_entitlement: snapshot.state.internal_entitlement,
          snapshot_id: snapshot.snapshot_id,
        },
      });
    }

    previousConflict = conflict;
    previous = snapshot;
  }

  const previousObservationBySource = new Map<string, ContinuitySnapshot>();
  for (const current of ordered) {
    const currentSource = sourceIdentity(current);
    if (!currentSource) continue;
    const prior = previousObservationBySource.get(currentSource);
    if (prior) {
      const priorObservations = observationMap(prior);
      const currentObservations = observationMap(current);
      const shared = Object.keys(currentObservations).filter((key) =>
        Object.prototype.hasOwnProperty.call(priorObservations, key),
      );
      const changes = Object.fromEntries(
        shared
          .filter(
            (key) =>
              JSON.stringify(priorObservations[key]) !==
              JSON.stringify(currentObservations[key]),
          )
          .map((key) => [
            key,
            { from: priorObservations[key], to: currentObservations[key] },
          ]),
      );
      if (Object.keys(changes).length) {
        items.push({
          id: `observation-revision:${prior.snapshot_id}:${current.snapshot_id}`,
          at: current.captured_at,
          kind: "revision",
          label: `Source reports changed value: ${Object.keys(changes).join(", ")}`,
          confidence: confidenceOf(current),
          source: currentSource,
          details: {
            comparison: "same-source-explicit-observation-revision",
            prior_snapshot_id: prior.snapshot_id,
            current_snapshot_id: current.snapshot_id,
            changes,
          },
        });
      }
    }
    previousObservationBySource.set(currentSource, current);
  }

  const activeConflictEpisodes = new Map<
    string,
    {
      item: ContinuityReasoningItem;
      lastConfirmedMs: number;
      snapshotIds: Set<string>;
      confirmationCount: number;
    }
  >();
  const flushEpisode = (key: string) => {
    const episode = activeConflictEpisodes.get(key);
    if (!episode) return;
    episode.item.details = {
      ...episode.item.details,
      snapshot_ids: [...episode.snapshotIds],
      confirmation_count: episode.confirmationCount,
    };
    items.push(episode.item);
    activeConflictEpisodes.delete(key);
  };

  for (let currentIndex = 0; currentIndex < ordered.length; currentIndex++) {
    const current = ordered[currentIndex];
    const currentSource = sourceIdentity(current);
    if (!currentSource) continue;
    const currentObservations = observationMap(current);
    const currentMs = Date.parse(current.captured_at);
    for (let priorIndex = currentIndex - 1; priorIndex >= 0; priorIndex--) {
      const prior = ordered[priorIndex];
      const delta = currentMs - Date.parse(prior.captured_at);
      if (delta > CROSS_SOURCE_WINDOW_MS) break;
      const priorSource = sourceIdentity(prior);
      if (!priorSource || priorSource === currentSource) continue;
      const priorObservations = observationMap(prior);
      const shared = Object.keys(currentObservations).filter((key) =>
        Object.prototype.hasOwnProperty.call(priorObservations, key),
      );
      for (const observationKey of shared) {
        if (
          JSON.stringify(currentObservations[observationKey]) ===
          JSON.stringify(priorObservations[observationKey])
        )
          continue;

        const canonicalSources = [priorSource, currentSource].sort();
        const episodeKey = `${canonicalSources[0]}|${canonicalSources[1]}|${observationKey}`;
        const confidenceValues = [confidenceOf(prior), confidenceOf(current)].filter(
          (value): value is number => value !== null,
        );
        const pairConfidence = confidenceValues.length
          ? Math.min(...confidenceValues)
          : null;
        const existing = activeConflictEpisodes.get(episodeKey);

        if (
          existing &&
          currentMs - existing.lastConfirmedMs <= CROSS_SOURCE_WINDOW_MS
        ) {
          existing.lastConfirmedMs = currentMs;
          existing.snapshotIds.add(prior.snapshot_id);
          existing.snapshotIds.add(current.snapshot_id);
          existing.confirmationCount += 1;
          existing.item.at = current.captured_at;
          if (pairConfidence !== null)
            existing.item.confidence =
              existing.item.confidence === null
                ? pairConfidence
                : Math.min(existing.item.confidence, pairConfidence);
          existing.item.details = {
            ...existing.item.details,
            last_confirmed_at: current.captured_at,
            latest_snapshot_ids: {
              prior: prior.snapshot_id,
              current: current.snapshot_id,
            },
            latest_differences: {
              [observationKey]: {
                [priorSource]: priorObservations[observationKey],
                [currentSource]: currentObservations[observationKey],
              },
            },
          };
          continue;
        }

        if (existing) flushEpisode(episodeKey);
        const item: ContinuityReasoningItem = {
          id: `cross-source-conflict:${prior.snapshot_id}:${current.snapshot_id}:${observationKey}`,
          at: current.captured_at,
          kind: "conflict",
          label: `Independent sources disagree: ${observationKey}`,
          confidence: pairConfidence,
          source: `${canonicalSources[0]} ↔ ${canonicalSources[1]}`,
          details: {
            comparison: "near-simultaneous-independent-sources",
            observation_key: observationKey,
            window_minutes: CROSS_SOURCE_WINDOW_MS / 60000,
            prior_snapshot_id: prior.snapshot_id,
            current_snapshot_id: current.snapshot_id,
            first_detected_at: current.captured_at,
            last_confirmed_at: current.captured_at,
            differences: {
              [observationKey]: {
                [priorSource]: priorObservations[observationKey],
                [currentSource]: currentObservations[observationKey],
              },
            },
            resolution: "unresolved",
          },
        };
        activeConflictEpisodes.set(episodeKey, {
          item,
          lastConfirmedMs: currentMs,
          snapshotIds: new Set([prior.snapshot_id, current.snapshot_id]),
          confirmationCount: 1,
        });
      }
    }
  }
  for (const key of [...activeConflictEpisodes.keys()]) flushEpisode(key);

  for (const event of events) {
    items.push({
      id: `inference:${event.event_id}`,
      at: event.detected_at,
      kind: "inference",
      label: event.event_type.replaceAll("_", " "),
      confidence: event.confidence,
      source: "DuckyDB continuity detector",
      details: {
        severity: event.severity,
        status: event.status,
        fingerprint: event.fingerprint,
        ...event.details,
      },
    });
  }

  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
