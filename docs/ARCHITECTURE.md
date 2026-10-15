# AEGIS Architecture Contract

## Identity

AEGIS is the architecture/research codename for the Lumanite Verity / Layer Eight stack.

- **Lumanite Systems** is the parent engineering identity.
- **Lumanite Verity** is the public name for the evidence-grounded contextual intelligence architecture.
- **Layer Eight** is the human-facing operator cockpit.
- **DuckyDB** remains the canonical internal engine for evidence, provenance, context, continuity, uncertainty, and reasoning.
- **Project Concord** is the humanitarian and defensive evaluation programme.

Public naming must not silently rename internal storage or API contracts where doing so would weaken provenance or break compatibility.

## Canonical reasoning flow

```text
SOURCE
  -> OBSERVATION
  -> CLAIM
  -> CONTEXT
  -> INFERENCE
  -> RECOMMENDATION
  -> HUMAN DECISION
  -> ACTION
  -> OUTCOME
```

Each stage should remain distinguishable in storage and in the operator interface.

## Evidence model

Evidence-bearing records should preserve, where applicable:

- stable identifier
- source reference
- observed time
- validity window
- confidence
- rationale
- contradiction links
- supersession links
- authority
- revision history

Conversation history, memory, model output, and user preference must not automatically be promoted to evidence.

## Continuity model

Continuity is a scoped evidence problem, not a telemetry free-for-all.

The current design uses:

- issuer-bound continuity context IDs
- source-bound, expiring and revocable credentials
- explicit allowed observation keys
- deterministic reporting cadence
- idempotent external event IDs
- capture/transmission quality
- immutable source observations
- derived reasoning history
- human review of conflicts

A device may report only explicitly configured state. Silence changes reporting freshness, not truth.

### Reporting states

A governed source can be:

- `current`
- `late`
- `stale`
- `never_seen`
- `expired`
- `revoked`

`stale` means the expected source has not reported within its governed cadence. It does not mean the previously observed state became false.

## Conflict handling

Near-simultaneous disagreement from independent sources should produce a conflict candidate without automatically choosing a winner.

Human review may classify a conflict as:

- unresolved
- prior observation supported
- current observation supported
- both valid in context
- insufficient evidence

Review metadata must not overwrite or delete the original observations.

Supported conclusions require scoped evidence. `insufficient evidence` is a valid outcome and must not require manufactured proof.

## Authority boundary

Technical capability and authority are separate concepts.

Default posture:

- read-only or simulation where practical
- explicit authority for high-impact actions
- separation or dual control where practical
- durable audit events
- pause, revoke, rollback and shutdown controls
- confidence is never proof or moral authority

The architecture does not treat capability expansion as permission expansion.

## Local model boundary

Local model execution may use Ollama or another local runtime, but model availability and model permission are separate states. Organization policy decides which installed models are allowed for governed generation.

## Repository boundary

The repository must not contain:

- bearer tokens or credential material
- local `.env` files
- continuity evidence from real users/devices
- D1/SQLite runtime databases
- local model blobs
- machine-specific runtime state
- authentication cookies
- private service logs containing sensitive context

Examples and fixtures must use synthetic data.

## Engineering rule

**Power should become more accountable as capability increases.**
