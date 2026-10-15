# AEGIS Architecture Contract

## Identity

AEGIS is the architecture/research codename for the Lumanite Verity / Layer Eight stack.

- **Lumanite Systems** is the parent engineering identity.
- **Lumanite Verity** is the evidence-grounded contextual intelligence architecture.
- **Layer Eight** is the human-facing strategic command cockpit.
- **DuckyDB** remains the canonical internal engine for evidence, provenance, context, continuity, uncertainty, and reasoning.
- **AEGIS Strategic Mesh** is the distributed node, mission, temporal-analysis, and resilience architecture.
- **Project Concord** is the humanitarian and defensive evaluation programme.

Public naming must not silently rename internal storage or API contracts where doing so would weaken provenance or break compatibility.

## Strategic direction

AEGIS is intended to behave less like a conventional assistant and more like a persistent strategic intelligence network.

The architecture may become highly capable at:

- maintaining distributed situational awareness
- reconciling independent observations
- tracking system state through time
- generating hypotheses and plans
- coordinating bounded agents
- recovering owned services
- simulating degraded and adversarial conditions
- verifying the outcomes of authorised actions

Capability does not grant authority.

## Canonical reasoning flow

```text
SOURCE
  -> OBSERVATION
  -> CLAIM
  -> CONTEXT
  -> INFERENCE
  -> PREDICTION
  -> RECOMMENDATION
  -> HUMAN DECISION / DELEGATED AUTHORITY
  -> ACTION
  -> VERIFICATION
  -> OUTCOME
```

Each stage must remain distinguishable in storage and in the operator interface.

## Global State Graph

The Global State Graph is the strategic memory of the system.

It may contain governed representations of:

- people
- devices
- services
- locations
- projects
- systems
- credentials
- assets
- incidents
- objectives
- commitments
- evidence records
- hypotheses
- risks
- decisions
- actions
- outcomes

Graph relationships preserve, where applicable:

- source
- observed time
- validity interval
- confidence
- authority
- contradiction links
- supersession links
- provenance path

The graph must explicitly distinguish:

```text
OBSERVED
CLAIMED
INFERRED
PREDICTED
PROPOSED
AUTHORIZED
EXECUTED
VERIFIED
```

No stage may silently promote itself to another.

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

Conversation history, memory, model output, simulation output, and user preference must not automatically be promoted to evidence.

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

## Strategic Situation Engine

The Situation Engine transforms evidence-grounded state into an operator-facing strategic picture.

It should identify:

- meaningful changes
- stale or missing sources
- unresolved conflicts
- blocked objectives
- fragile dependencies
- pending approvals
- likely failure paths
- unknown or insufficient-evidence states

Priority may consider urgency, confidence, reversibility, dependency depth, and operator-defined objectives.

The Situation Engine must not hide uncertainty to make the operational picture appear cleaner.

## Mission Graph

An objective becomes a durable Mission Graph rather than a transient prompt chain.

Mission records should preserve:

- objective
- success criteria
- assumptions
- information requirements
- dependencies
- task DAG
- assigned agent
- authority class
- checkpoints
- rollback conditions
- completion evidence

Canonical task states:

```text
PLANNED
READY
BLOCKED
AWAITING_EVIDENCE
AWAITING_APPROVAL
RUNNING
VERIFYING
COMPLETE
FAILED
ROLLED_BACK
ABORTED
```

A mission is not complete because a tool reports success. Completion requires verification evidence.

## Temporal Analysis Engine

AEGIS may reconstruct its state as it was known at an earlier time and run isolated counterfactual branches.

Temporal operations include:

- `REWIND` — reconstruct state known at time T using only evidence available by T
- `BRANCH` — create an isolated hypothetical branch
- `SIMULATE` — apply hypothetical events without mutating canonical evidence
- `COMPARE` — compare canonical and hypothetical timelines
- `EXPLAIN_DELTA` — identify which observations, assumptions, or decisions produced divergent outcomes

Simulation output must remain distinguishable from observed history.

## Bounded agent fabric

Specialised agents may operate inside explicit capability envelopes.

Suggested classes:

- Sentinel — health, freshness, policy drift, anomaly observation
- Analyst — explanation, hypothesis, comparison, risk analysis
- Scout — explicitly authorised information gathering
- Planner — mission decomposition and candidate-plan generation
- Operator — reversible delegated execution
- Repair — bounded service recovery
- Archivist — provenance, checkpoints, temporal reconstruction
- Adversary Simulator — synthetic hostile/degraded scenario testing

No agent may expand its own permissions or create a new execution authority merely because a capability is technically available.

## Self-healing boundary

AEGIS may autonomously repair owned and explicitly authorised services within a bounded recovery policy.

Permitted examples:

- restart a known owned service
- reconnect a known authenticated dependency
- rebuild a derived cache
- fail over to an approved standby
- restore bounded configuration from an approved checkpoint
- enter degraded mode

Not permitted:

- hidden persistence
- copying itself to unapproved systems
- resisting removal
- bypassing revocation
- acquiring credentials without authority
- disabling operator shutdown

Resilience is not self-preservation authority.

## Authority boundary

Technical capability and authority are separate concepts.

Every execution-capable task should be classified by impact.

### GREEN

Read, analyse, simulate, inspect, health-check, or perform explicitly delegated reversible maintenance.

May run automatically if policy permits.

### AMBER

Changes persistent configuration, communicates externally, modifies durable data, or affects another system.

Requires explicit delegated authority or operator approval.

### RED

Irreversible, destructive, privacy-invasive, safety-critical, high-impact, or physical-world action.

AEGIS may analyse and recommend but does not autonomously execute.

No component may downgrade its own authority classification.

Default posture also includes:

- read-only or simulation where practical
- separation or dual control where practical
- durable audit events
- pause, revoke, rollback and shutdown controls
- confidence is never proof or moral authority

The architecture does not treat capability expansion as permission expansion.

## Layer Eight command interface

Layer Eight should evolve into a strategic command surface with dedicated views for:

- Strategic Overview
- Global State
- Missions
- Temporal Analysis
- Threat / Adversary Simulation
- Continuity
- Mesh topology
- System Integrity
- Authority Gate

Conversation remains available but is not the sole operating model.

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

## Engineering rules

**A missing observation is not an observation of absence.**

**Capability expansion is not authority expansion.**

**A mission is not complete until its outcome is verified.**

**Power should become more accountable as capability increases.**
