import assert from "node:assert/strict";
import test from "node:test";
import {
  continuityReportingProfile,
  observationKeysAllowed,
  parseContinuityProfileMetadata,
  sourceMatchesContinuityProfile,
} from "../lib/continuity-profile.ts";

const metadata = {
  continuityContextId: "l8_0123456789abcdef01234567",
  binding: "issuer",
  boundAt: "2026-10-14T10:00:00.000Z",
  profileVersion: 1,
  sourceKind: "device",
  sourceId: "surface-away",
  expectedEveryMinutes: 60,
  graceMinutes: 15,
  allowedObservationKeys: ["layer_eight_healthy", "tailnet_reachable"],
};

function profile(overrides = {}, now = Date.parse("2026-10-14T12:00:00.000Z")) {
  return continuityReportingProfile(
    {
      credentialId: "cred-1",
      label: "Surface Away",
      expiresAt: "2026-11-14T00:00:00.000Z",
      revokedAt: null,
      lastSeenAt: "2026-10-14T11:30:00.000Z",
      metadata,
      ...overrides,
    },
    now,
  );
}

test("continuity profile metadata binds source identity, cadence and observation keys", () => {
  assert.deepEqual(parseContinuityProfileMetadata(metadata), metadata);
  assert.equal(parseContinuityProfileMetadata({ ...metadata, sourceId: "" }), null);
  assert.equal(parseContinuityProfileMetadata({ ...metadata, expectedEveryMinutes: 0 }), null);
  assert.equal(parseContinuityProfileMetadata({ ...metadata, profileVersion: 2 }), null);
  assert.equal(parseContinuityProfileMetadata({ ...metadata, continuityContextId: "not-a-context" }), null);
  assert.equal(parseContinuityProfileMetadata({ ...metadata, allowedObservationKeys: [] }), null);
  assert.equal(
    parseContinuityProfileMetadata({
      ...metadata,
      allowedObservationKeys: ["layer_eight_healthy", "layer_eight_healthy"],
    }),
    null,
  );
  assert.equal(
    parseContinuityProfileMetadata({ ...metadata, allowedObservationKeys: ["not allowed!"] }),
    null,
  );
});

test("legacy profiles remain readable until rotated onto key governance", () => {
  const legacy = { ...metadata };
  delete legacy.allowedObservationKeys;
  const parsed = parseContinuityProfileMetadata(legacy);
  assert.ok(parsed);
  assert.equal(parsed.allowedObservationKeys, null);
  assert.equal(observationKeysAllowed(parsed, ["legacy_any_key"]), true);
});

test("credential profile accepts omitted client identity but rejects impersonation", () => {
  const parsed = parseContinuityProfileMetadata(metadata);
  assert.ok(parsed);
  assert.equal(sourceMatchesContinuityProfile(parsed), true);
  assert.equal(sourceMatchesContinuityProfile(parsed, "device", "surface-away"), true);
  assert.equal(sourceMatchesContinuityProfile(parsed, "device", "home-base"), false);
  assert.equal(sourceMatchesContinuityProfile(parsed, "system", "surface-away"), false);
});

test("strict profiles reject observation keys outside their capability", () => {
  const parsed = parseContinuityProfileMetadata(metadata);
  assert.ok(parsed);
  assert.equal(observationKeysAllowed(parsed, []), true);
  assert.equal(observationKeysAllowed(parsed, ["layer_eight_healthy"]), true);
  assert.equal(
    observationKeysAllowed(parsed, ["layer_eight_healthy", "tailnet_reachable"]),
    true,
  );
  assert.equal(observationKeysAllowed(parsed, ["browser_history"]), false);
});

test("reporting freshness distinguishes current, late, stale and never seen", () => {
  assert.equal(profile().status, "current");
  assert.equal(profile({ lastSeenAt: "2026-10-14T10:55:00.000Z" }).status, "late");
  assert.equal(profile({ lastSeenAt: "2026-10-14T10:30:00.000Z" }).status, "stale");
  assert.equal(profile({ lastSeenAt: null }).status, "never_seen");
});

test("revocation and expiry override cadence freshness", () => {
  assert.equal(profile({ revokedAt: "2026-10-14T11:45:00.000Z" }).status, "revoked");
  assert.equal(profile({ expiresAt: "2026-10-14T11:59:00.000Z" }).status, "expired");
});

test("profile exposes policy and timing without converting silence into state", () => {
  const result = profile();
  assert.equal(result.nextDueAt, "2026-10-14T12:30:00.000Z");
  assert.equal(result.staleAt, "2026-10-14T12:45:00.000Z");
  assert.deepEqual(result.allowedObservationKeys, metadata.allowedObservationKeys);
  assert.equal(Object.hasOwn(result, "observations"), false);
});
