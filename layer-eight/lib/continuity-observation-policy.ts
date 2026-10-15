export type ContinuityObservationValue = string | number | boolean | null;

type ObservationDefinition = {
  type: "string" | "number" | "boolean" | "null";
  scope: "local-health" | "shared";
  meaning: string;
};

export const CONTINUITY_OBSERVATION_DEFINITIONS = {
  duckydb_core_healthy: {
    type: "boolean",
    scope: "local-health",
    meaning: "The local canonical DuckyDB health check completed successfully on the reporting host.",
  },
  layer_eight_healthy: {
    type: "boolean",
    scope: "local-health",
    meaning: "The local Layer Eight health check completed successfully on the reporting host.",
  },
  ollama_healthy: {
    type: "boolean",
    scope: "local-health",
    meaning: "The local Ollama health check completed successfully on the reporting host.",
  },
  duck_worker_healthy: {
    type: "boolean",
    scope: "local-health",
    meaning: "The local Duck worker health check completed successfully on the reporting host.",
  },
  health_check_complete: {
    type: "boolean",
    scope: "local-health",
    meaning: "The bounded local health checker produced a result for every configured health target.",
  },
  layer_eight_endpoint_reachable: {
    type: "boolean",
    scope: "shared",
    meaning: "The configured shared Layer Eight endpoint returned an HTTP response within the reporter timeout; an authentication boundary response counts as reachable.",
  },
  continuity_protocol_version: {
    type: "string",
    scope: "shared",
    meaning: "The continuity observation semantic contract version implemented by the reporter.",
  },
} as const satisfies Record<string, ObservationDefinition>;

export type ContinuityObservationKey = keyof typeof CONTINUITY_OBSERVATION_DEFINITIONS;

export function continuityObservationKeysPolicyError(keys: string[]): string | null {
  for (const key of keys) {
    if (!(key in CONTINUITY_OBSERVATION_DEFINITIONS))
      return `Observation key is not approved: ${key}`;
  }
  return null;
}

function valueType(value: ContinuityObservationValue) {
  return value === null ? "null" : typeof value;
}

export function continuityObservationPolicyError(
  observations: Record<string, ContinuityObservationValue> | undefined,
): string | null {
  if (!observations) return null;
  const keyError = continuityObservationKeysPolicyError(Object.keys(observations));
  if (keyError) return keyError;
  for (const [key, value] of Object.entries(observations)) {
    const definition = CONTINUITY_OBSERVATION_DEFINITIONS[key as ContinuityObservationKey];
    if (valueType(value) !== definition.type)
      return `Observation ${key} must be ${definition.type}`;
  }
  return null;
}
