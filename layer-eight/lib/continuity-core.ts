const coreUrl = (process.env.DUCKYDB_CORE_URL || "http://127.0.0.1:8765").replace(/\/$/, "");

export type ContinuityEvent = {
  event_id: string;
  context_id: string;
  event_type: string;
  severity: string;
  detected_at: string;
  status: string;
  confidence: number;
  fingerprint: string;
  details: Record<string, unknown>;
};

export type ContinuitySnapshot = {
  snapshot_id: string;
  context_id: string;
  captured_at: string;
  classification: "observed" | "last_known_good" | "first_known_bad";
  evidence_id: string | null;
  state: Record<string, unknown>;
};

export type ContinuityRecoveryComponent = {
  status: string;
  evidence: string[];
  note?: string | null;
};

export type ContinuityRecovery = {
  recovery_id: string;
  context_id: string;
  opened_at: string;
  status: string;
  required_components: string[];
  components: Record<string, ContinuityRecoveryComponent>;
  closed_at: string | null;
};

export async function scopedContinuityContextId(tenantId: string, userId: string) {
  const bytes = new TextEncoder().encode(`layer-eight|${tenantId}|${userId}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `l8_${hex.slice(0, 24)}`;
}

export async function hashContinuityAnchor(value: string) {
  const bytes = new TextEncoder().encode(`layer-eight-anchor|${value.trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getContinuityEvents(contextId: string): Promise<ContinuityEvent[]> {
  const response = await fetch(`${coreUrl}/continuity/events?context_id=${encodeURIComponent(contextId)}`, {
    signal: AbortSignal.timeout(5_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`DuckyDB continuity ${response.status}`);
  return (await response.json()) as ContinuityEvent[];
}

async function coreJson(path: string, init?: RequestInit) {
  const response = await fetch(`${coreUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DuckyDB continuity ${response.status}: ${text.slice(0, 300)}`);
  }
  return response.json();
}

export async function ensureContinuitySubject(contextId: string, label: string) {
  return coreJson("/continuity/humans", {
    method: "POST",
    body: JSON.stringify({ context_id: contextId, created_at: new Date().toISOString(), label }),
  }) as Promise<{ context_id: string }>;
}

export async function ingestContinuityEvidence(
  actor: string,
  observation: string,
  confidence: number,
) {
  return coreJson("/evidence", {
    method: "POST",
    body: JSON.stringify({
      actor,
      source: "layer-eight-continuity-manual",
      observation,
      evidence_type: "continuity_snapshot",
      confidence,
      manually_entered: true,
      direct_observation: false,
    }),
  }) as Promise<{ id: string; seal?: Record<string, unknown> }>;
}

export async function ingestContinuityObservationEvidence(input: {
  actor: string;
  sourceId: string;
  observation: string;
  confidence: number;
  metadata: Record<string, unknown>;
}) {
  return coreJson("/evidence", {
    method: "POST",
    body: JSON.stringify({
      actor: input.actor,
      source: "layer-eight-continuity-observation",
      source_id: input.sourceId,
      observation: input.observation,
      evidence_type: "continuity_observation",
      confidence: input.confidence,
      manually_entered: false,
      direct_observation: true,
      notes:
        "Credential-authenticated device/system observation. Source authentication establishes provenance, not infallibility.",
      metadata: input.metadata,
    }),
  }) as Promise<{ id: string; seal?: Record<string, unknown> }>;
}

export async function addContinuitySnapshot(
  contextId: string,
  classification: "observed" | "last_known_good" | "first_known_bad",
  state: Record<string, unknown>,
  evidenceId?: string,
) {
  return coreJson(`/continuity/${encodeURIComponent(contextId)}/snapshots`, {
    method: "POST",
    body: JSON.stringify({ captured_at: new Date().toISOString(), classification, state, ...(evidenceId ? { evidence_id: evidenceId } : {}) }),
  }) as Promise<{ snapshot_id: string }>;
}

export async function getContinuitySnapshots(contextId: string): Promise<ContinuitySnapshot[]> {
  return coreJson(`/continuity/${encodeURIComponent(contextId)}/snapshots`) as Promise<ContinuitySnapshot[]>;
}

export async function runContinuityDetection(contextId: string) {
  return coreJson(`/continuity/${encodeURIComponent(contextId)}/detect`, {
    method: "POST",
    body: "{}",
  }) as Promise<Array<{ event_type: string; severity: string; confidence: number; details: Record<string, unknown> }>>;
}

export async function getContinuityRecoveries(contextId: string): Promise<ContinuityRecovery[]> {
  return coreJson(`/continuity/recovery?context_id=${encodeURIComponent(contextId)}`) as Promise<ContinuityRecovery[]>;
}

export async function openContinuityRecovery(contextId: string, requiredComponents: string[]) {
  return coreJson("/continuity/recovery", {
    method: "POST",
    body: JSON.stringify({ context_id: contextId, required_components: requiredComponents }),
  }) as Promise<{ recovery_id: string }>;
}

export async function updateContinuityRecoveryComponent(
  recoveryId: string,
  component: string,
  status: "pending" | "restored" | "failed",
  evidence: string[],
  note?: string,
) {
  return coreJson(`/continuity/recovery/${encodeURIComponent(recoveryId)}/component`, {
    method: "POST",
    body: JSON.stringify({ component, status, evidence, ...(note ? { note } : {}) }),
  }) as Promise<ContinuityRecovery>;
}
