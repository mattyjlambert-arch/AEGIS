# Layer Eight Strategic Command UX

## Purpose

Layer Eight should feel like the command interface to a persistent strategic intelligence network, not a chat application surrounded by status widgets.

The visual and interaction model may draw heavily from the command-network atmosphere of *Terminator* while preserving AEGIS governance and human authority.

Ducky remains the primary operator-facing conversational intelligence. AEGIS is the underlying strategic mesh.

```text
OPERATOR
   ↕
DUCKY
   ↕
LAYER EIGHT COMMAND SURFACE
   ↕
AEGIS STRATEGIC MESH
   ↕
VERITY / DUCKYDB EVIDENCE + CONTEXT
```

---

## Boot experience

The command surface should establish system state immediately.

Example sequence:

```text
AEGIS STRATEGIC MESH
INITIALIZING...

DUCKYDB .............. ONLINE
LAYER EIGHT .......... ONLINE
LOCAL MODEL FABRIC ... ONLINE
CONTINUITY ........... SYNCHRONIZED
MISSION CONTROL ...... READY
TEMPORAL ENGINE ...... STANDBY
SENTINEL NETWORK ..... ACTIVE
AUTHORITY GATE ....... ENFORCED

AEGIS // OPERATIONAL
```

Boot output must reflect real health checks. It must never print fictional success states merely for aesthetics.

---

## Alert states

Use a small number of system-wide alert levels.

### NOMINAL

All critical systems healthy. No urgent unresolved strategic condition.

### WATCH

New conflicts, stale sources, unusual changes, or pending evidence require attention.

### DEGRADED

One or more important dependencies are unavailable or stale, but the system can continue in a reduced mode.

### CRITICAL

An important objective, service, or evidence chain has failed and requires operator action.

### CONTAINMENT

AEGIS has intentionally restricted a subsystem, credential, agent, mission, or execution capability because a safety/governance boundary was triggered.

Alert level is derived from evidence and policy. It is not selected for dramatic effect.

---

## Strategic Overview

This is the primary screen.

### Top rail

Always visible:

- current alert level
- verified current time
- mesh node count
- stale node count
- active missions
- pending approvals
- unresolved conflicts
- model availability
- last verified system checkpoint

### Primary situation pane

Ranked list of the most operationally important items:

```text
[CRITICAL] DuckyDB core unavailable on Node Atlas
           confidence 1.00
           source: Sentinel / health check
           action: recovery candidate available

[WATCH]    Surface and Home-Base disagree on shared endpoint reachability
           confidence 0.82
           state: unresolved
           evidence: 4 observations

[BLOCKED]  Mission M-104 cannot continue
           waiting on: operator approval
```

Every item must expose provenance.

### Ducky pane

Ducky explains the strategic picture in normal language and can answer questions about any displayed object.

Ducky should be able to say:

> Home-Base is healthy. Surface is stale by 18 minutes, so I am not treating its last report as current. One mission is waiting for your approval and there is one unresolved cross-source conflict.

That answer should be assembled from governed state, not improvised memory.

---

## Global State

A graph view showing entities and relationships.

Node categories may include:

- people
- devices
- services
- credentials
- incidents
- objectives
- missions
- evidence
- hypotheses
- risks

Visual treatment should encode epistemic class:

- observed
- claimed
- inferred
- predicted
- proposed
- authorised
- executed
- verified

Clicking an edge should expose provenance, confidence and validity interval.

The graph should never imply certainty merely because an edge is drawn.

---

## Mesh topology

A live topology representation of authorised AEGIS nodes.

Each node exposes:

- governed identity
- online / late / stale / offline status
- capability envelope
- observation capability
- execution capability
- local models
- dependencies
- last verified heartbeat
- credential expiry
- recovery state

Example:

```text
                    ┌─ SURFACE-AWAY
                    │   observer
                    │   state: current
                    │
HOME-BASE ── AEGIS CORE ── OLLAMA
   │                │
   │                └─ DUCK WORKER
   │
   └─ LAYER EIGHT
```

Topology reflects real registered nodes only.

---

## Mission Control

Display each objective as a durable graph of work.

### Mission header

- mission ID
- objective
- owner
- priority
- authority class
- start time
- current state
- expected success criteria

### DAG

```text
OBJECTIVE
   ↓
COLLECT EVIDENCE
   ↓
ANALYSE
   ↓
PROPOSE PLAN
   ↓
[AUTHORITY GATE]
   ↓
EXECUTE
   ↓
VERIFY
```

Task states should be visually distinct:

- PLANNED
- READY
- BLOCKED
- AWAITING_EVIDENCE
- AWAITING_APPROVAL
- RUNNING
- VERIFYING
- COMPLETE
- FAILED
- ROLLED_BACK
- ABORTED

A mission cannot display COMPLETE without verification evidence.

---

## Temporal Analysis

The timeline should feel like scrubbing through the system's memory.

### Timeline rail

Show:

- observations
- conflicts
- revisions
- decisions
- actions
- recoveries
- mission transitions
- evidence arrivals

### REWIND

Move the entire command surface to the state AEGIS actually knew at a past time.

Future evidence must disappear from the reconstructed view.

### BRANCH

Create a visibly isolated counterfactual timeline.

Branch UI should always display:

```text
SIMULATION BRANCH
NOT CANONICAL HISTORY
```

### COMPARE

Split view:

```text
CANONICAL HISTORY  │  BRANCH T-04
───────────────────┼────────────────
actual observation │ hypothetical event
actual decision    │ alternate action
actual outcome     │ simulated outcome
```

---

## Conflict Matrix

A dedicated view for disagreement.

Columns:

- conflict
- sources
- first detected
- last confirmed
- confidence
- evidence count
- freshness
- human review state

Review options remain:

- unresolved
- prior observation supported
- current observation supported
- both valid in context
- insufficient evidence

No UI control should say merely `Resolve` if the system is actually choosing one claim over another.

---

## Threat / Adversary Simulation

This view is simulation-only.

It evaluates:

- dependency failure
- credential compromise scenarios
- network partitions
- stale observations
- contradictory trusted sources
- model unavailability
- service failure
- hostile or malformed input
- compromised assumptions

Display candidate failure paths and defensive recommendations.

The interface must clearly distinguish simulated threats from observed incidents.

---

## System Integrity

A command-network health view.

Track:

- DuckyDB
- Layer Eight
- model runtime
- Duck worker
- node fabric
- D1 / persistence
- scheduled reporters
- credential health
- migrations
- checkpoints
- backups
- CI state

Each component shows:

```text
STATE
LAST VERIFIED
SOURCE
DEPENDENCIES
RECOVERY POLICY
LAST RECOVERY
```

---

## Authority Gate

All AMBER actions enter a visible approval queue.

Each approval card must answer:

- what will happen?
- why is it proposed?
- what evidence supports it?
- what systems are affected?
- what data is modified?
- is it reversible?
- what is the rollback path?
- what verifies success?

RED actions remain recommendation/simulation only.

---

## Command palette

A fast keyboard-driven command surface should coexist with Ducky chat.

Examples:

```text
> mesh status
> mission show M-104
> rewind 2026-10-15T03:30
> conflicts unresolved
> explain node surface-away
> simulate loss home-base
> integrity check
> approvals pending
```

Commands should resolve to typed internal actions, not raw shell execution.

---

## Ducky's role

Ducky is the human interface to the strategic mesh.

Ducky may:

- explain current state
- summarize changes
- interrogate provenance
- propose missions
- compare plans
- run simulations
- surface approvals
- explain uncertainty
- coordinate bounded agents

Ducky does not become a permission bypass.

The desired personality is intelligent, direct and alive, while the underlying system remains evidence-grounded.

---

## Visual system

Suggested presentation:

- near-black base surfaces
- muted graphite panels
- restrained red for alert / active strategic state
- amber for pending authority
- desaturated green for verified healthy state
- high-contrast white/grey text
- monospaced system labels paired with readable UI typography
- thin topology lines
- live activity pulses
- confidence bars
- provenance indicators
- temporal tick marks
- no decorative fake data

Red should mean something. If everything glows red, nothing is an alert.

---

## Experience invariant

**Layer Eight should make the operator feel that the whole authorised system is thinking together, while always showing what it actually knows, what it merely suspects, and what still requires human authority.**
