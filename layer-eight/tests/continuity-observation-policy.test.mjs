import test from "node:test";
import assert from "node:assert/strict";
import {
  continuityObservationKeysPolicyError,
  continuityObservationPolicyError,
} from "../lib/continuity-observation-policy.ts";

test("approved continuity keys are globally semantic, not free-form", () => {
  assert.equal(
    continuityObservationKeysPolicyError([
      "duckydb_core_healthy",
      "layer_eight_endpoint_reachable",
      "continuity_protocol_version",
    ]),
    null,
  );
  assert.match(
    continuityObservationKeysPolicyError(["conversation_visible_v2"]),
    /not approved/,
  );
});

test("observation values must match the approved key type", () => {
  assert.equal(
    continuityObservationPolicyError({
      layer_eight_endpoint_reachable: true,
      continuity_protocol_version: "1",
    }),
    null,
  );
  assert.match(
    continuityObservationPolicyError({ layer_eight_endpoint_reachable: "yes" }),
    /must be boolean/,
  );
  assert.match(
    continuityObservationPolicyError({ continuity_protocol_version: 1 }),
    /must be string/,
  );
});

test("unknown observation keys are rejected at ingestion too", () => {
  assert.match(
    continuityObservationPolicyError({ made_up_state: true }),
    /not approved/,
  );
});
