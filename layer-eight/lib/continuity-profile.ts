export type ContinuitySourceKind = "device" | "system" | "connector";

export type ContinuityProfileMetadata = {
  continuityContextId: string;
  binding: "issuer";
  boundAt: string;
  profileVersion: 1;
  sourceKind: ContinuitySourceKind;
  sourceId: string;
  expectedEveryMinutes: number;
  graceMinutes: number;
  allowedObservationKeys: string[] | null;
};

export type ContinuityProfileStatus =
  | "current"
  | "late"
  | "stale"
  | "never_seen"
  | "expired"
  | "revoked";

export type ContinuityReportingProfile = {
  credentialId: string;
  label: string;
  sourceKind: ContinuitySourceKind;
  sourceId: string;
  boundAt: string;
  expectedEveryMinutes: number;
  graceMinutes: number;
  allowedObservationKeys: string[] | null;
  lastSeenAt: string | null;
  nextDueAt: string | null;
  staleAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  status: ContinuityProfileStatus;
};

const sourceKinds = new Set<ContinuitySourceKind>([
  "device",
  "system",
  "connector",
]);
const observationKeyPattern = /^[A-Za-z0-9_.:-]+$/;

function finiteInteger(value: unknown, min: number, max: number) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function parseAllowedObservationKeys(value: unknown): string[] | null | undefined {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length < 1 || value.length > 20)
    return undefined;
  if (
    value.some(
      (key) =>
        typeof key !== "string" ||
        key.length < 1 ||
        key.length > 80 ||
        key !== key.trim() ||
        !observationKeyPattern.test(key),
    )
  )
    return undefined;
  if (new Set(value).size !== value.length) return undefined;
  return [...value];
}

export function parseContinuityProfileMetadata(
  value: unknown,
): ContinuityProfileMetadata | null {
  if (!value || typeof value !== "object") return null;
  const x = value as Record<string, unknown>;
  const allowedObservationKeys = parseAllowedObservationKeys(
    x.allowedObservationKeys,
  );
  if (
    allowedObservationKeys === undefined ||
    typeof x.continuityContextId !== "string" ||
    !/^l8_[0-9a-f]{24}$/.test(x.continuityContextId) ||
    x.binding !== "issuer" ||
    typeof x.boundAt !== "string" ||
    x.profileVersion !== 1 ||
    typeof x.sourceKind !== "string" ||
    !sourceKinds.has(x.sourceKind as ContinuitySourceKind) ||
    typeof x.sourceId !== "string" ||
    x.sourceId.trim().length < 1 ||
    x.sourceId.length > 160 ||
    !finiteInteger(x.expectedEveryMinutes, 1, 10080) ||
    !finiteInteger(x.graceMinutes, 0, 1440)
  )
    return null;
  return {
    continuityContextId: x.continuityContextId,
    binding: "issuer",
    boundAt: x.boundAt,
    profileVersion: 1,
    sourceKind: x.sourceKind as ContinuitySourceKind,
    sourceId: x.sourceId,
    expectedEveryMinutes: x.expectedEveryMinutes as number,
    graceMinutes: x.graceMinutes as number,
    allowedObservationKeys,
  };
}

export function continuityReportingProfile(
  input: {
    credentialId: string;
    label: string;
    expiresAt: string;
    revokedAt: string | null;
    lastSeenAt: string | null;
    metadata: ContinuityProfileMetadata;
  },
  now = Date.now(),
): ContinuityReportingProfile {
  const last = input.lastSeenAt ? Date.parse(input.lastSeenAt) : Number.NaN;
  const due = Number.isFinite(last)
    ? last + input.metadata.expectedEveryMinutes * 60_000
    : Number.NaN;
  const stale = Number.isFinite(due)
    ? due + input.metadata.graceMinutes * 60_000
    : Number.NaN;
  let status: ContinuityProfileStatus;
  if (input.revokedAt) status = "revoked";
  else if (Date.parse(input.expiresAt) <= now) status = "expired";
  else if (!Number.isFinite(last)) status = "never_seen";
  else if (now <= due) status = "current";
  else if (now <= stale) status = "late";
  else status = "stale";
  return {
    credentialId: input.credentialId,
    label: input.label,
    sourceKind: input.metadata.sourceKind,
    sourceId: input.metadata.sourceId,
    boundAt: input.metadata.boundAt,
    expectedEveryMinutes: input.metadata.expectedEveryMinutes,
    graceMinutes: input.metadata.graceMinutes,
    allowedObservationKeys: input.metadata.allowedObservationKeys,
    lastSeenAt: input.lastSeenAt,
    nextDueAt: Number.isFinite(due) ? new Date(due).toISOString() : null,
    staleAt: Number.isFinite(stale) ? new Date(stale).toISOString() : null,
    expiresAt: input.expiresAt,
    revokedAt: input.revokedAt,
    status,
  };
}

export function sourceMatchesContinuityProfile(
  metadata: ContinuityProfileMetadata,
  sourceKind?: string,
  sourceId?: string,
) {
  if (sourceKind !== undefined && sourceKind !== metadata.sourceKind) return false;
  if (sourceId !== undefined && sourceId !== metadata.sourceId) return false;
  return true;
}

export function observationKeysAllowed(
  metadata: ContinuityProfileMetadata,
  keys: string[],
) {
  if (metadata.allowedObservationKeys === null) return true;
  const allowed = new Set(metadata.allowedObservationKeys);
  return keys.every((key) => allowed.has(key));
}
